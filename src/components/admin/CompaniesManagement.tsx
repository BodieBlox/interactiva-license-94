
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Users, Edit, User, Trash2, Palette, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getUsers, updateDashboardCustomization, updateUser } from '@/utils/api';
import { User as UserType } from '@/utils/types';

export default function CompaniesManagement() {
  const [activeTab, setActiveTab] = useState('companies');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companyUsers, setCompanyUsers] = useState<UserType[]>([]);
  const [showEditBrandingDialog, setShowEditBrandingDialog] = useState(false);
  const [editCompanyData, setEditCompanyData] = useState<{
    companyName: string;
    primaryColor: string;
    userId: string;
  } | null>(null);

  // Fetch all users
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  });

  // Extract unique companies from users
  const companies = users.reduce((acc: { name: string; adminId: string; primaryColor: string; memberCount: number }[], user) => {
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
          ).length
        });
      }
    }
    return acc;
  }, []);

  // Filter users by selected company
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
      if (!user) return;

      // Remove company affiliation
      const updatedCustomization = {
        ...user.customization,
        companyName: undefined,
        isCompanyMember: false
      };

      await updateDashboardCustomization(userId, updatedCustomization);
      
      // If user was not an admin, remove enterprise license
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
    const adminUser = users.find(user => 
      user.customization?.companyName === companyName && 
      (user.isCompanyAdmin || user.role === 'admin')
    );
    
    if (adminUser) {
      setEditCompanyData({
        companyName: companyName,
        primaryColor: adminUser.customization?.primaryColor || '#6366f1',
        userId: adminUser.id
      });
      setShowEditBrandingDialog(true);
    }
  };

  const handleUpdateBranding = async () => {
    if (!editCompanyData) return;
    
    try {
      const { userId, companyName, primaryColor } = editCompanyData;
      const adminUser = users.find(u => u.id === userId);
      
      if (!adminUser) return;
      
      // Update admin's customization
      await updateDashboardCustomization(userId, {
        ...adminUser.customization,
        companyName,
        primaryColor
      });
      
      // Update all company members
      const memberUpdates = companyUsers
        .filter(user => user.id !== userId && user.customization?.isCompanyMember)
        .map(user => 
          updateDashboardCustomization(user.id, {
            ...user.customization,
            companyName,
            primaryColor
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
                <Button variant="outline" onClick={() => setActiveTab('companies')}>
                  Back to Companies
                </Button>
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
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Company Branding Dialog */}
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
    </div>
  );
}
