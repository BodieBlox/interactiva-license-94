import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Users, Edit, User, Trash2, Palette, Check, PlusCircle, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getUsers, updateDashboardCustomization, updateUser } from '@/utils/api';
import { User as UserType } from '@/utils/types';
import { 
  createCompany, 
  addCompanyMember, 
  removeCompanyMember, 
  updateCompany,
  getCompanyById,
  getCompanyMembers,
  sendCompanyInvitation,
  deleteCompany
} from '@/utils/companyApi';

interface Company {
  name: string;
  adminId: string;
  primaryColor: string;
  memberCount: number;
  id?: string;
}

interface EditCompanyData {
  companyName: string;
  primaryColor: string;
  userId: string;
  companyId?: string;
}

interface NewCompanyData {
  name: string;
  primaryColor: string;
}

interface InviteData {
  email: string;
  companyId: string;
  companyName: string;
}

export const CompanyManagement = () => {
  const [activeTab, setActiveTab] = useState('companies');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companyUsers, setCompanyUsers] = useState<UserType[]>([]);
  const [showEditBrandingDialog, setShowEditBrandingDialog] = useState(false);
  const [showCreateCompanyDialog, setShowCreateCompanyDialog] = useState(false);
  const [showInviteUserDialog, setShowInviteUserDialog] = useState(false);
  const [editCompanyData, setEditCompanyData] = useState<EditCompanyData | null>(null);
  const [newCompanyData, setNewCompanyData] = useState<NewCompanyData>({
    name: '',
    primaryColor: '#6366f1'
  });
  const [inviteData, setInviteData] = useState<InviteData>({
    email: '',
    companyId: '',
    companyName: ''
  });

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  });

  const companies = users.reduce((acc: Company[], user) => {
    if (user.customization?.companyName && (user.isCompanyAdmin || user.role === 'admin')) {
      const companyExists = acc.find(c => c.name === user.customization.companyName);
      if (!companyExists) {
        acc.push({
          name: user.customization.companyName,
          adminId: user.id,
          primaryColor: user.customization.primaryColor || '#6366f1',
          memberCount: users.filter(u => 
            u.customization?.companyName === user.customization.companyName || 
            u.customization?.isCompanyMember
          ).length,
          id: user.customization?.companyId
        });
      }
    }
    return acc;
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      const filteredUsers = users.filter(user => 
        user.customization?.companyName === selectedCompany ||
        (user.customization?.isCompanyMember && user.customization?.companyName === selectedCompany)
      );
      setCompanyUsers(filteredUsers);
    } else {
      setCompanyUsers([]);
    }
  }, [selectedCompany, users]);

  const handleSelectCompany = (companyName: string) => {
    setSelectedCompany(companyName);
    setActiveTab('members');
  };

  const handleRemoveFromCompany = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user || !user.customization?.companyName) return;
      
      const company = companies.find(c => c.name === user.customization?.companyName);
      if (!company || !company.id) {
        toast({
          title: "Error",
          description: "Company ID not found",
          variant: "destructive"
        });
        return;
      }

      await removeCompanyMember(company.id, userId);
      
      const updatedCustomization = {
        ...user.customization,
        companyName: undefined,
        companyId: undefined,
        isCompanyMember: false
      };

      await updateDashboardCustomization(userId, updatedCustomization);
      
      if (!user.isCompanyAdmin) {
        await updateUser(userId, {
          licenseActive: false,
          licenseType: undefined
        });
      }

      toast({
        title: "User Removed",
        description: "User has been removed from the company",
      });

      refetch();
    } catch (error) {
      console.error('Error removing user from company:', error);
      toast({
        title: "Error",
        description: `Failed to remove user from company: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const handleEditBranding = (companyName: string) => {
    const company = companies.find(c => c.name === companyName);
    if (!company) return;
    
    setEditCompanyData({
      companyName: companyName,
      primaryColor: company.primaryColor || '#6366f1',
      userId: company.adminId,
      companyId: company.id
    });
    setShowEditBrandingDialog(true);
  };

  const handleUpdateBranding = async () => {
    if (!editCompanyData) return;
    
    try {
      const { userId, companyName, primaryColor, companyId } = editCompanyData;
      const adminUser = users.find(u => u.id === userId);
      
      if (!adminUser) return;
      
      if (companyId) {
        await updateCompany(companyId, {
          branding: {
            primaryColor,
            approved: true
          },
          name: companyName
        });
      }
      
      await updateDashboardCustomization(userId, {
        ...adminUser.customization,
        companyName,
        primaryColor,
        approved: true
      });
      
      const memberUpdates = companyUsers
        .filter(user => user.id !== userId && user.customization?.isCompanyMember)
        .map(user => 
          updateDashboardCustomization(user.id, {
            ...user.customization,
            companyName,
            primaryColor,
            approved: true
          })
        );
      
      await Promise.all(memberUpdates);
      
      toast({
        title: "Branding Updated",
        description: "Company branding has been updated for all members",
      });
      
      setShowEditBrandingDialog(false);
      refetch();
    } catch (error) {
      console.error('Error updating company branding:', error);
      toast({
        title: "Error",
        description: `Failed to update company branding: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      await updateUser(userId, { isCompanyAdmin: true });
      
      toast({
        title: "Admin Assigned",
        description: "User is now a company admin",
      });
      
      refetch();
    } catch (error) {
      console.error('Error making user company admin:', error);
      toast({
        title: "Error",
        description: `Failed to update user role: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const handleCreateCompany = async () => {
    try {
      if (!newCompanyData.name.trim()) {
        toast({
          title: "Error",
          description: "Company name is required",
          variant: "destructive"
        });
        return;
      }

      const adminUser = users.find(user => user.role === 'admin');
      if (!adminUser) {
        toast({
          title: "Error",
          description: "No admin user found",
          variant: "destructive"
        });
        return;
      }

      const newCompany = await createCompany({
        name: newCompanyData.name,
        branding: {
          primaryColor: newCompanyData.primaryColor,
          approved: true
        }
      }, adminUser.id);

      await updateDashboardCustomization(adminUser.id, {
        companyName: newCompanyData.name,
        primaryColor: newCompanyData.primaryColor,
        approved: true,
        companyId: newCompany.id
      });

      await updateUser(adminUser.id, { 
        isCompanyAdmin: true,
        licenseType: 'enterprise',
        licenseActive: true
      });

      toast({
        title: "Company Created",
        description: "New company has been created successfully",
      });

      setShowCreateCompanyDialog(false);
      setNewCompanyData({ name: '', primaryColor: '#6366f1' });
      refetch();
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: "Error",
        description: `Failed to create company: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const handleInviteUser = async () => {
    try {
      if (!inviteData.email.trim() || !inviteData.companyId) {
        toast({
          title: "Error",
          description: "Email and company are required",
          variant: "destructive"
        });
        return;
      }

      const targetUser = users.find(user => user.email === inviteData.email);
      if (!targetUser) {
        toast({
          title: "Error",
          description: "User not found with this email",
          variant: "destructive"
        });
        return;
      }

      const company = await getCompanyById(inviteData.companyId);
      if (!company) {
        toast({
          title: "Error",
          description: "Company not found",
          variant: "destructive"
        });
        return;
      }

      const adminUser = users.find(user => user.id === company.adminId);
      if (!adminUser) {
        toast({
          title: "Error",
          description: "Company admin not found",
          variant: "destructive"
        });
        return;
      }

      await sendCompanyInvitation({
        fromUserId: adminUser.id,
        fromUsername: adminUser.username,
        companyId: company.id,
        companyName: company.name,
        toUserId: targetUser.id,
        toEmail: targetUser.email,
        primaryColor: company.branding?.primaryColor,
        logo: company.branding?.logo
      });

      toast({
        title: "Invitation Sent",
        description: `Invitation has been sent to ${targetUser.email}`,
      });

      setShowInviteUserDialog(false);
      setInviteData({ email: '', companyId: '', companyName: '' });
      refetch();
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error",
        description: `Failed to invite user: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!companyId) return;
    
    try {
      await deleteCompany(companyId);
      toast({
        title: "Success",
        description: "Company has been deleted successfully"
      });
      refetch();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Companies Management</h1>
          <TabsList>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="members" disabled={!selectedCompany}>Company Members</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="companies" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => setShowCreateCompanyDialog(true)}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Create Company
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>All Companies</CardTitle>
              <CardDescription>View and manage company accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                </div>
              ) : companies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Branding Color</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.name}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            {company.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-4 w-4 rounded-full" 
                              style={{ backgroundColor: company.primaryColor }}
                            />
                            {company.primaryColor}
                          </div>
                        </TableCell>
                        <TableCell>{company.memberCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (company.id) {
                                  window.open(`/admin/company/chat/${company.id}`, '_blank');
                                } else {
                                  toast({
                                    title: "Error",
                                    description: "Company ID not found",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Chat
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSelectCompany(company.name)}
                            >
                              <Users className="h-4 w-4 mr-1" /> 
                              View Members
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditBranding(company.name)}
                            >
                              <Palette className="h-4 w-4 mr-1" /> 
                              Edit Branding
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteCompany(company.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> 
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No companies found</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowCreateCompanyDialog(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create your first company
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          {selectedCompany && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    {selectedCompany} - Members
                  </CardTitle>
                  <CardDescription>Manage users in this company</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const company = companies.find(c => c.name === selectedCompany);
                      if (company) {
                        setInviteData({
                          email: '',
                          companyId: company.id || '',
                          companyName: company.name
                        });
                        setShowInviteUserDialog(true);
                      }
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('companies')}>
                    Back to Companies
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {companyUsers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {user.username}
                              {user.isCompanyAdmin && (
                                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                                  Admin
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.isCompanyAdmin ? 'Company Admin' : 'Company Member'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {!user.isCompanyAdmin && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleMakeAdmin(user.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" /> 
                                  Make Admin
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRemoveFromCompany(user.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-1" /> 
                                Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No members found for this company</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        const company = companies.find(c => c.name === selectedCompany);
                        if (company) {
                          setInviteData({
                            email: '',
                            companyId: company.id || '',
                            companyName: company.name
                          });
                          setShowInviteUserDialog(true);
                        }
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Invite your first member
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showEditBrandingDialog} onOpenChange={setShowEditBrandingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company Branding</DialogTitle>
            <DialogDescription>
              Update the branding for this company. Changes will apply to all members.
            </DialogDescription>
          </DialogHeader>
          
          {editCompanyData && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={editCompanyData.companyName}
                  onChange={(e) => setEditCompanyData({
                    ...editCompanyData,
                    companyName: e.target.value
                  })}
                  placeholder="Enter company name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="brandColor">Brand Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="brandColor"
                    value={editCompanyData.primaryColor}
                    onChange={(e) => setEditCompanyData({
                      ...editCompanyData,
                      primaryColor: e.target.value
                    })}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={editCompanyData.primaryColor}
                    onChange={(e) => setEditCompanyData({
                      ...editCompanyData,
                      primaryColor: e.target.value
                    })}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-secondary/20 rounded-md">
                <div className="font-medium mb-2">Preview</div>
                <div 
                  className="h-8 rounded-md" 
                  style={{ backgroundColor: editCompanyData.primaryColor }}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditBrandingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBranding}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateCompanyDialog} onOpenChange={setShowCreateCompanyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Create a new company and assign it to an admin user.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newCompanyName">Company Name</Label>
              <Input
                id="newCompanyName"
                value={newCompanyData.name}
                onChange={(e) => setNewCompanyData({
                  ...newCompanyData,
                  name: e.target.value
                })}
                placeholder="Enter company name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newBrandColor">Brand Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  id="newBrandColor"
                  value={newCompanyData.primaryColor}
                  onChange={(e) => setNewCompanyData({
                    ...newCompanyData,
                    primaryColor: e.target.value
                  })}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <Input
                  value={newCompanyData.primaryColor}
                  onChange={(e) => setNewCompanyData({
                    ...newCompanyData,
                    primaryColor: e.target.value
                  })}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-secondary/20 rounded-md">
              <div className="font-medium mb-2">Preview</div>
              <div 
                className="h-8 rounded-md" 
                style={{ backgroundColor: newCompanyData.primaryColor }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCompanyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCompany}>
              Create Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInviteUserDialog} onOpenChange={setShowInviteUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User to Company</DialogTitle>
            <DialogDescription>
              Invite a user to join {inviteData.companyName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userEmail">User Email</Label>
              <Input
                id="userEmail"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({
                  ...inviteData,
                  email: e.target.value
                })}
                placeholder="Enter user email"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser}>
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

