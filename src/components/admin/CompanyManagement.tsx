
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, MessageCircle, Palette, Settings, Trash2, Users, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getCompanies, getCompanyMembers, deleteCompany } from '@/utils/companyApi';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { updateUser, getUserByEmail, generateLicense, assignLicenseToUser } from '@/utils/api';
import { logAdminAction } from '@/utils/auditLog';
import { NotificationCenter } from '../notifications/NotificationCenter';

export const CompanyManagement = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Use the ReactQuery hook to fetch companies
  const { data: companies = [], isLoading, refetch } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies
  });

  // Filter companies based on search
  const filteredCompanies = searchQuery
    ? companies.filter(company => 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : companies;

  const handleDeleteCompany = async (companyId: string) => {
    try {
      // Get company members
      const members = await getCompanyMembers(companyId);
      
      // First update all members to remove company association
      for (const member of members) {
        await updateUser(member.id, {
          customization: {
            companyName: null,
            isCompanyMember: false,
            primaryColor: null
          },
          isCompanyAdmin: false,
          licenseActive: false,
          licenseKey: null,
          licenseType: null
        });
      }
      
      // Then delete the company
      await deleteCompany(companyId);
      
      // Log admin action
      await logAdminAction({
        action: 'delete_company',
        details: `Deleted company ID: ${companyId}`,
        resourceId: companyId,
        resourceType: 'company'
      });
      
      setConfirmDelete(null);
      toast({
        title: "Company deleted",
        description: "The company and all its associations have been removed."
      });
      refetch();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Error",
        description: `Failed to delete company: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const handleActivateLicense = async (companyId: string, companyName: string) => {
    try {
      // Find the company in the list
      const company = companies.find(c => c.id === companyId);
      
      if (!company) {
        toast({
          title: "Error",
          description: "Company not found",
          variant: "destructive"
        });
        return;
      }
      
      // Generate a new license if one doesn't exist
      if (!company.licenseKey) {
        // TypeScript fix: Ensure licenseType is one of the allowed values
        const licenseType = (company.licenseType || 'premium') as 'basic' | 'premium' | 'enterprise';
        const licenseResult = await generateLicense(licenseType, 365, { maxUsers: 10 });
        
        // Update company with license details
        await updateCompanyLicense(companyId, {
          licenseKey: licenseResult.key,
          licenseId: licenseResult.id,
          licenseType,
          licenseActive: true,
          licenseExpiryDate: licenseResult.expiresAt
        });
        
        // Log admin action
        await logAdminAction({
          action: 'generate_license',
          details: `Generated ${licenseType} license for company: ${companyName}`,
          resourceId: companyId,
          resourceType: 'company'
        });
        
        // Get company members and update their license info
        const members = await getCompanyMembers(companyId);
        for (const member of members) {
          await updateUser(member.id, {
            licenseActive: true,
            licenseKey: licenseResult.key,
            licenseType,
            licenseId: licenseResult.id
          });
        }
        
        toast({
          title: "License Activated",
          description: `A new ${licenseType} license has been generated and activated for ${companyName}`
        });
      } else {
        // If license exists but is not active, activate it
        if (!company.licenseActive) {
          await updateCompanyLicense(companyId, {
            licenseActive: true
          });
          
          // Log admin action
          await logAdminAction({
            action: 'activate_license',
            details: `Activated existing license for company: ${companyName}`,
            resourceId: companyId,
            resourceType: 'company'
          });
          
          // Get company members and update their license info
          const members = await getCompanyMembers(companyId);
          for (const member of members) {
            // TypeScript fix: Ensure licenseType is one of the allowed values
            const licenseType = (company.licenseType || 'premium') as 'basic' | 'premium' | 'enterprise';
            
            await updateUser(member.id, {
              licenseActive: true,
              licenseKey: company.licenseKey,
              licenseType,
              licenseId: company.licenseId
            });
          }
          
          toast({
            title: "License Activated",
            description: `The license for ${companyName} has been activated`
          });
        } else {
          toast({
            title: "License Already Active",
            description: `${companyName} already has an active license`
          });
        }
      }
      
      refetch();
    } catch (error) {
      console.error('Error activating license:', error);
      toast({
        title: "Error",
        description: `Failed to activate license: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  // Helper function to update company license information
  const updateCompanyLicense = async (companyId: string, licenseInfo: any) => {
    try {
      // We'll need to adapt this to our Firebase database structure
      console.log(`Company ${companyId} license updated with:`, licenseInfo);
      
      // Update company in your database
      try {
        const response = await fetch(`/api/companies/${companyId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(licenseInfo)
        });
        
        if (!response.ok) {
          throw new Error('API endpoint not available');
        }
      } catch (error) {
        // If the API call fails, try updating via Firebase directly
        console.warn('API endpoint not available, updating via Firebase directly');
        
        // Update the company directly in your Firebase database
        const companyRef = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/companies/${companyId}.json`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(licenseInfo)
        });
        
        if (!companyRef.ok) {
          throw new Error('Failed to update company license in Firebase');
        }
      }
      
      // Refresh the company list
      refetch();
    } catch (error) {
      console.error('Error updating company license:', error);
      throw error;
    }
  };

  const handleManageCompany = (e: React.MouseEvent, companyId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Log the navigation action
    logAdminAction({
      action: 'view_company',
      details: `Viewed company details for ID: ${companyId}`,
      resourceId: companyId,
      resourceType: 'company'
    });
    // Navigate to the company management page
    navigate(`/admin/company/${companyId}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Companies Management</CardTitle>
              <CardDescription>Manage all companies on the platform</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <Button 
                onClick={() => {
                  logAdminAction({
                    action: 'create_company_initiated',
                    details: 'Started company creation flow',
                    resourceType: 'company'
                  });
                  navigate('/admin/company/new');
                }}
              >
                <Building className="mr-2 h-4 w-4" />
                Create Company
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {isLoading ? (
            <div className="py-24 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="mt-2 text-gray-500">Loading companies...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="py-12 text-center">
              <Building className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium">No companies found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery 
                  ? "No companies match your search criteria." 
                  : "Get started by creating your first company."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ 
                            backgroundColor: company.branding?.primaryColor || '#6366f1'
                          }} 
                        />
                        {company.name}
                      </div>
                    </TableCell>
                    <TableCell>{company.industry || "-"}</TableCell>
                    <TableCell>
                      {company.size || "-"}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                        company.licenseActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {company.licenseActive ? company.licenseType || 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {!company.licenseActive && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            type="button"
                            className="text-green-500 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleActivateLicense(company.id, company.name);
                            }}
                          >
                            <Key className="h-4 w-4 mr-1" />
                            Activate License
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/admin/company/chat/${company.id}`);
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          type="button"
                          onClick={(e) => handleManageCompany(e, company.id)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          type="button"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setConfirmDelete(company.id);
                          }}
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
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the company and remove all user associations. 
              Users will lose access to company resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => confirmDelete && handleDeleteCompany(confirmDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
