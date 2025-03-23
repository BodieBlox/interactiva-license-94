import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building, Users, Edit, User, Trash2, Palette, Check, Plus, 
  AlertCircle, UserPlus, Mail, Clock, ChevronsUpDown, CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateDashboardCustomization, updateUser } from '@/utils/api';
import { User as UserType } from '@/utils/types';
import { Company, sanitizeCustomizationData, sanitizeUserData } from '@/utils/companyTypes';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { colorOptions } from '@/components/user/settings/colorOptions';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const CompanyManagementPanel = () => {
  const [activeTab, setActiveTab] = useState('companies');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companyUsers, setCompanyUsers] = useState<UserType[]>([]);
  const [showEditBrandingDialog, setShowEditBrandingDialog] = useState(false);
  const [showAddCompanyDialog, setShowAddCompanyDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [showInviteUserDialog, setShowInviteUserDialog] = useState(false);
  const [deleteCompanyId, setDeleteCompanyId] = useState<string | null>(null);
  
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    primaryColor: '#7E69AB'
  });
  
  const [editCompanyData, setEditCompanyData] = useState<{
    companyName: string;
    primaryColor: string;
    userId: string;
  } | null>(null);
  
  const [inviteData, setInviteData] = useState({
    email: '',
    companyId: ''
  });
  
  const queryClient = useQueryClient();

  const { 
    data: users = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  });

  const companies = users.reduce((acc: { name: string; adminId: string; primaryColor: string; memberCount: number }[], user) => {
    if (user.customization?.companyName && (user.isCompanyAdmin || user.role === 'admin')) {
      const companyExists = acc.find(c => c.name === user.customization.companyName);
      if (!companyExists) {
        acc.push({
          name: user.customization.companyName,
          adminId: user.id,
          primaryColor: user.customization.primaryColor || '#7E69AB',
          memberCount: users.filter(u => 
            u.customization?.companyName === user.customization.companyName || 
            u.customization?.isCompanyMember
          ).length
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

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string, data: Partial<UserType> }) => {
      const sanitizedData = sanitizeUserData(data);
      return updateUser(userId, sanitizedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "User has been updated",
      });
    },
    onError: (error) => {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const updateBrandingMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string, data: any }) => {
      const sanitizedData = sanitizeCustomizationData(data);
      return updateDashboardCustomization(userId, sanitizedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "Company branding has been updated",
      });
    },
    onError: (error) => {
      console.error('Error updating branding:', error);
      toast({
        title: "Error",
        description: `Failed to update branding: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const handleSelectCompany = (companyName: string) => {
    setSelectedCompany(companyName);
    setActiveTab('members');
  };

  const handleRemoveFromCompany = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const updatedCustomization = {
      ...user.customization,
      companyName: undefined,
      isCompanyMember: false
    };

    updateBrandingMutation.mutate({ 
      userId, 
      data: updatedCustomization 
    });
    
    if (!user.isCompanyAdmin) {
      updateUserMutation.mutate({
        userId,
        data: {
          licenseActive: false,
          licenseType: undefined
        }
      });
    }
  };

  const handleEditBranding = (companyName: string) => {
    const adminUser = users.find(user => 
      user.customization?.companyName === companyName && 
      (user.isCompanyAdmin || user.role === 'admin')
    );
    
    if (adminUser) {
      setEditCompanyData({
        companyName: companyName,
        primaryColor: adminUser.customization?.primaryColor || '#7E69AB',
        userId: adminUser.id
      });
      setShowEditBrandingDialog(true);
    }
  };

  const handleUpdateBranding = async () => {
    if (!editCompanyData) return;
    
    const { userId, companyName, primaryColor } = editCompanyData;
    const adminUser = users.find(u => u.id === userId);
    
    if (!adminUser) return;
    
    updateBrandingMutation.mutate({
      userId,
      data: {
        companyName,
        primaryColor,
        approved: true
      }
    });
    
    companyUsers
      .filter(user => user.id !== userId && user.customization?.isCompanyMember)
      .forEach(user => {
        updateBrandingMutation.mutate({
          userId: user.id,
          data: {
            companyName,
            primaryColor,
            isCompanyMember: true
          }
        });
      });
    
    setShowEditBrandingDialog(false);
  };

  const handleMakeAdmin = async (userId: string) => {
    updateUserMutation.mutate({
      userId,
      data: { 
        isCompanyAdmin: true,
        licenseType: 'enterprise',
        licenseActive: true
      }
    });
  };
  
  const handleAddCompany = () => {
    if (!newCompanyData.name.trim()) {
      toast({
        title: "Error",
        description: "Company name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    const adminUser = users.find(user => user.role === 'admin');
    
    if (!adminUser) {
      toast({
        title: "Error",
        description: "No admin user found to create company",
        variant: "destructive"
      });
      return;
    }
    
    updateBrandingMutation.mutate({
      userId: adminUser.id,
      data: {
        companyName: newCompanyData.name,
        primaryColor: newCompanyData.primaryColor,
        approved: true,
        isCompanyMember: false
      }
    });
    
    updateUserMutation.mutate({
      userId: adminUser.id,
      data: { 
        isCompanyAdmin: true,
        licenseType: 'enterprise',
        licenseActive: true
      }
    });
    
    setShowAddCompanyDialog(false);
    setNewCompanyData({
      name: '',
      primaryColor: '#7E69AB'
    });
  };
  
  const handleDeleteCompany = (companyName: string) => {
    setDeleteCompanyId(companyName);
    setShowDeleteConfirmDialog(true);
  };
  
  const confirmDeleteCompany = async () => {
    if (!deleteCompanyId) return;
    
    const companyUsers = users.filter(user => 
      user.customization?.companyName === deleteCompanyId ||
      (user.customization?.isCompanyMember && user.customization?.companyName === deleteCompanyId)
    );
    
    companyUsers.forEach(user => {
      updateBrandingMutation.mutate({
        userId: user.id,
        data: {
          companyName: null,
          isCompanyMember: false,
          primaryColor: null
        }
      });
      
      if (!user.isCompanyAdmin && user.role !== 'admin') {
        updateUserMutation.mutate({
          userId: user.id,
          data: {
            licenseActive: false,
            licenseType: null,
            isCompanyAdmin: false
          }
        });
      } else {
        updateUserMutation.mutate({
          userId: user.id,
          data: {
            isCompanyAdmin: false
          }
        });
      }
    });
    
    setShowDeleteConfirmDialog(false);
    setDeleteCompanyId(null);
    setSelectedCompany(null);
    setActiveTab('companies');
    
    toast({
      title: "Company Deleted",
      description: "The company and all its associations have been removed",
    });
  };
  
  const handleInviteUser = () => {
    if (!selectedCompany) return;
    
    setInviteData({
      email: '',
      companyId: selectedCompany
    });
    setShowInviteUserDialog(true);
  };
  
  const sendInvitation = async () => {
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
        description: "No user found with that email",
        variant: "destructive"
      });
      return;
    }
    
    const adminUser = users.find(user => 
      user.customization?.companyName === inviteData.companyId && 
      (user.isCompanyAdmin || user.role === 'admin')
    );
    
    if (!adminUser) {
      toast({
        title: "Error",
        description: "Company admin not found",
        variant: "destructive"
      });
      return;
    }
    
    updateBrandingMutation.mutate({
      userId: targetUser.id,
      data: {
        pendingInvitation: {
          fromUserId: adminUser.id,
          fromUsername: adminUser.username,
          companyName: inviteData.companyId,
          timestamp: new Date().toISOString(),
          primaryColor: adminUser.customization?.primaryColor || '#7E69AB'
        }
      }
    });
    
    setShowInviteUserDialog(false);
    
    toast({
      title: "Invitation Sent",
      description: `An invitation has been sent to ${targetUser.username}`,
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Company Management</h1>
            <p className="text-muted-foreground">Manage company accounts and their team members</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowAddCompanyDialog(true)}
              className="flex items-center gap-2 bg-centralai-purple hover:bg-centralai-accent"
            >
              <Plus size={16} />
              <span>Add Company</span>
            </Button>
            <TabsList>
              <TabsTrigger value="companies">Companies</TabsTrigger>
              <TabsTrigger value="members" disabled={!selectedCompany}>Members</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="companies" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>All Companies</CardTitle>
              <CardDescription>View and manage company accounts on CentralAI</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="p-6 text-center">
                  <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-2" />
                  <h3 className="font-medium text-lg mb-1">Failed to load companies</h3>
                  <p className="text-muted-foreground mb-3">
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
                  >
                    Try Again
                  </Button>
                </div>
              ) : companies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Branding</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.name} className="hover:bg-muted/40">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-centralai-purple" />
                            <span className="font-medium">{company.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-4 w-4 rounded-full" 
                              style={{ backgroundColor: company.primaryColor }}
                            />
                            <span className="text-muted-foreground">{company.primaryColor}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{company.memberCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => handleSelectCompany(company.name)}
                            >
                              <Users className="h-4 w-4 mr-1" /> 
                              Manage
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => handleEditBranding(company.name)}
                            >
                              <Palette className="h-4 w-4 mr-1" /> 
                              Branding
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              onClick={() => handleDeleteCompany(company.name)}
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
                <div className="text-center py-12 space-y-4">
                  <Building className="h-16 w-16 mx-auto mb-3 text-muted-foreground/30" />
                  <h3 className="text-lg font-medium">No companies found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-2">
                    Create your first company to manage teams and branding across multiple users.
                  </p>
                  <Button 
                    onClick={() => setShowAddCompanyDialog(true)}
                    className="bg-centralai-purple hover:bg-centralai-accent"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Company
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          {selectedCompany && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Building className="h-5 w-5 text-centralai-purple" />
                    {selectedCompany} Members
                  </CardTitle>
                  <CardDescription>
                    Manage users and permissions for this company
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleInviteUser}
                  >
                    <UserPlus size={16} />
                    <span>Invite User</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('companies')}
                  >
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
                        <TableHead>License</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/40">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-centralai-accent/20 flex items-center justify-center text-centralai-accent">
                                <User size={16} />
                              </div>
                              <div>
                                <div className="font-medium">{user.username}</div>
                                {user.isCompanyAdmin && (
                                  <div className="text-xs text-primary font-medium mt-0.5">
                                    Company Admin
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                              user.isCompanyAdmin 
                                ? 'bg-primary/20 text-primary' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {user.isCompanyAdmin ? 'Admin' : 'Member'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                              user.licenseType === 'enterprise'
                                ? 'bg-green-500/20 text-green-500' 
                                : 'bg-amber-500/20 text-amber-500'
                            }`}>
                              {user.licenseType || 'None'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {!user.isCompanyAdmin && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-muted-foreground hover:text-foreground"
                                  onClick={() => handleMakeAdmin(user.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" /> 
                                  Make Admin
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                onClick={() => handleRemoveFromCompany(user.id)}
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
                  <div className="text-center py-12 space-y-3">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground/30" />
                    <h3 className="text-lg font-medium">No members found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-4">
                      This company doesn't have any members yet. Invite users to join this company.
                    </p>
                    <Button
                      onClick={handleInviteUser}
                      className="bg-centralai-purple hover:bg-centralai-accent"
                    >
                      <UserPlus size={16} className="mr-2" />
                      Invite User
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showAddCompanyDialog} onOpenChange={setShowAddCompanyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>
              Create a new company and set its branding preferences.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Enter company name"
                value={newCompanyData.name}
                onChange={(e) => setNewCompanyData({
                  ...newCompanyData,
                  name: e.target.value
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brandColor">Brand Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="brandColor"
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
            
            <div className="bg-muted/50 rounded-md p-3 mt-3">
              <div className="font-medium mb-2 text-sm">Preview</div>
              <div className="space-y-2">
                <div className="h-8 rounded-md" style={{ backgroundColor: newCompanyData.primaryColor }} />
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  <span className="font-medium">{newCompanyData.name || 'Company Name'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setShowAddCompanyDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddCompany}
              disabled={!newCompanyData.name.trim()}
              className="bg-centralai-purple hover:bg-centralai-accent"
            >
              <Plus size={16} className="mr-2" />
              Create Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="flex-1 justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-4 w-4 rounded-full" 
                            style={{ backgroundColor: editCompanyData.primaryColor }} 
                          />
                          <span>
                            {colorOptions.find(c => c.color === editCompanyData.primaryColor)?.label || 
                              editCompanyData.primaryColor}
                          </span>
                        </div>
                        <ChevronsUpDown size={16} className="ml-2 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="start">
                      <div className="p-2">
                        <div className="grid grid-cols-5 gap-1">
                          {colorOptions.map(color => (
                            <button
                              key={color.value}
                              className="w-8 h-8 rounded-md transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                              style={{ backgroundColor: color.color }}
                              onClick={() => setEditCompanyData({
                                ...editCompanyData,
                                primaryColor: color.color
                              })}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted/50 rounded-md">
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
            <Button 
              onClick={handleUpdateBranding}
              className="bg-centralai-purple hover:bg-centralai-accent"
            >
              <Check size={16} className="mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the company and all its associations. All members will lose company branding and enterprise licenses.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteCompany}
            >
              <Trash2 size={16} className="mr-2" />
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={showInviteUserDialog} onOpenChange={setShowInviteUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User to Company</DialogTitle>
            <DialogDescription>
              Send an invitation to join {selectedCompany}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="userEmail">User Email</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="userEmail"
                    placeholder="user@example.com"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({
                      ...inviteData,
                      email: e.target.value
                    })}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-md p-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">
                  After sending, the user will see an invitation notification in their dashboard
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setShowInviteUserDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={sendInvitation}
              disabled={!inviteData.email.trim()}
              className="bg-centralai-purple hover:bg-centralai-accent"
            >
              <UserPlus size={16} className="mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
