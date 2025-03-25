
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Users, Search, Edit, Trash2, UserPlus, KeyIcon, Info, Settings, Shield, Calendar, MessageSquare } from 'lucide-react';
import { getCompanies, getCompanyById, updateCompany, deleteCompany, getCompanyMembers, removeCompanyMember } from '@/utils/companyApi';
import { Company, UserWithCompany } from '@/utils/companyTypes';
import { CompanyChat } from './CompanyChat';

export const CompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyMembers, setCompanyMembers] = useState<UserWithCompany[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deleteCompany' | 'removeMember' | null>(null);
  const [selectedMember, setSelectedMember] = useState<UserWithCompany | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  
  // Edit form states
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editColor, setEditColor] = useState('');
  
  useEffect(() => {
    fetchCompanies();
  }, []);
  
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = companies.filter(company => 
        company.name.toLowerCase().includes(query) || 
        company.description?.toLowerCase().includes(query) ||
        company.industry?.toLowerCase().includes(query)
      );
      setFilteredCompanies(filtered);
    } else {
      setFilteredCompanies(companies);
    }
  }, [searchQuery, companies]);
  
  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const allCompanies = await getCompanies();
      setCompanies(allCompanies);
      setFilteredCompanies(allCompanies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectCompany = async (company: Company) => {
    setSelectedCompany(company);
    setEditName(company.name);
    setEditDescription(company.description || '');
    setEditIndustry(company.industry || '');
    setEditSize(company.size || '');
    setEditColor(company.branding?.primaryColor || '#6366f1');
    
    // Load company members
    setIsLoadingMembers(true);
    try {
      const members = await getCompanyMembers(company.id);
      setCompanyMembers(members);
    } catch (error) {
      console.error('Error fetching company members:', error);
      toast({
        title: "Error",
        description: "Failed to load company members",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };
  
  const handleConfirmAction = async () => {
    if (confirmAction === 'deleteCompany' && selectedCompany) {
      try {
        await deleteCompany(selectedCompany.id);
        toast({
          title: "Success",
          description: `Company "${selectedCompany.name}" has been deleted`,
        });
        setSelectedCompany(null);
        fetchCompanies();
      } catch (error) {
        console.error('Error deleting company:', error);
        toast({
          title: "Error",
          description: `Failed to delete company: ${(error as Error).message}`,
          variant: "destructive"
        });
      }
    } else if (confirmAction === 'removeMember' && selectedCompany && selectedMember) {
      try {
        await removeCompanyMember(selectedCompany.id, selectedMember.id);
        toast({
          title: "Success",
          description: `${selectedMember.username} has been removed from "${selectedCompany.name}"`,
        });
        // Refresh members list
        const updatedMembers = await getCompanyMembers(selectedCompany.id);
        setCompanyMembers(updatedMembers);
      } catch (error) {
        console.error('Error removing member:', error);
        toast({
          title: "Error",
          description: `Failed to remove member: ${(error as Error).message}`,
          variant: "destructive"
        });
      }
    }
    
    setConfirmDialogOpen(false);
    setConfirmAction(null);
    setSelectedMember(null);
  };
  
  const handleUpdateCompany = async () => {
    if (!selectedCompany) return;
    
    try {
      const updatedCompany = await updateCompany(selectedCompany.id, {
        name: editName,
        description: editDescription,
        industry: editIndustry,
        size: editSize,
        branding: {
          ...(selectedCompany.branding || {}),
          primaryColor: editColor
        }
      });
      
      setSelectedCompany(updatedCompany);
      setEditDialogOpen(false);
      
      // Update the companies list
      setCompanies(prev => 
        prev.map(company => 
          company.id === updatedCompany.id ? updatedCompany : company
        )
      );
      
      toast({
        title: "Success",
        description: `Company "${updatedCompany.name}" has been updated`,
      });
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Error",
        description: `Failed to update company: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteCompany = (company: Company) => {
    setSelectedCompany(company);
    setConfirmAction('deleteCompany');
    setConfirmDialogOpen(true);
  };
  
  const handleRemoveMember = (member: UserWithCompany) => {
    setSelectedMember(member);
    setConfirmAction('removeMember');
    setConfirmDialogOpen(true);
  };
  
  const formatLicenseType = (type?: string) => {
    if (!type) return 'No License';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  const getLicenseStatusBadge = (company: Company) => {
    if (!company.licenseKey) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-500">No License</Badge>;
    }
    
    if (!company.licenseActive) {
      return <Badge variant="outline" className="bg-red-100 text-red-600">Suspended</Badge>;
    }
    
    return <Badge variant="outline" className="bg-green-100 text-green-600">Active</Badge>;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Companies List */}
        <div className="md:col-span-1">
          <Card className="shadow-md border h-full bg-white">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-indigo-500" />
                  <span>Companies</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  onClick={() => window.location.href = '/company-generator'}
                >
                  <Building className="h-3.5 w-3.5 mr-1" />
                  <span>New</span>
                </Button>
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/30 bg-white"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {filteredCompanies.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No companies found
                </div>
              ) : (
                <ul className="divide-y">
                  {filteredCompanies.map((company) => (
                    <li 
                      key={company.id}
                      className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${selectedCompany?.id === company.id ? 'bg-slate-100' : ''}`}
                      onClick={() => handleSelectCompany(company)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border bg-slate-100">
                            {company.branding?.logo ? (
                              <AvatarImage src={company.branding.logo} alt={company.name} />
                            ) : (
                              <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                {company.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-sm">{company.name}</h3>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {company.industry || 'No industry specified'}
                            </p>
                          </div>
                        </div>
                        {getLicenseStatusBadge(company)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Company Details */}
        <div className="md:col-span-2">
          {selectedCompany ? (
            <Card className="shadow-md border bg-white">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Avatar className="h-8 w-8 border bg-slate-100">
                      {selectedCompany.branding?.logo ? (
                        <AvatarImage src={selectedCompany.branding.logo} alt={selectedCompany.name} />
                      ) : (
                        <AvatarFallback 
                          className="text-white"
                          style={{ backgroundColor: selectedCompany.branding?.primaryColor || '#6366f1' }}
                        >
                          {selectedCompany.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span>{selectedCompany.name}</span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-600 border-amber-200 hover:bg-amber-50"
                      onClick={() => setEditDialogOpen(true)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDeleteCompany(selectedCompany)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1">
                    <TabsTrigger value="info" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <Info className="h-4 w-4 mr-1" />
                      Info
                    </TabsTrigger>
                    <TabsTrigger value="members" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <Users className="h-4 w-4 mr-1" />
                      Members
                    </TabsTrigger>
                    <TabsTrigger value="license" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <KeyIcon className="h-4 w-4 mr-1" />
                      License
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Chat
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              
              <CardContent className="p-6">
                <TabsContent value="info" className="mt-0">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                      <p className="text-sm">{selectedCompany.description || 'No description provided'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Industry</h3>
                        <p className="text-sm">{selectedCompany.industry || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Size</h3>
                        <p className="text-sm capitalize">{selectedCompany.size || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Created</h3>
                        <p className="text-sm">
                          {selectedCompany.createdAt 
                            ? new Date(selectedCompany.createdAt).toLocaleDateString() 
                            : 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Primary Color</h3>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-4 w-4 rounded-full border"
                            style={{ backgroundColor: selectedCompany.branding?.primaryColor || '#6366f1' }}
                          ></div>
                          <span className="text-sm">{selectedCompany.branding?.primaryColor || 'Default'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="members" className="mt-0">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium">
                      Members ({companyMembers.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => toast({ title: "Info", description: "Member invitation functionality can be accessed from the company settings page" })}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" />
                      <span>Invite</span>
                    </Button>
                  </div>
                  
                  {isLoadingMembers ? (
                    <div className="flex justify-center py-10">
                      <div className="h-6 w-6 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    </div>
                  ) : companyMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No members found
                    </div>
                  ) : (
                    <ul className="divide-y border rounded-md">
                      {companyMembers.map((member) => (
                        <li key={member.id} className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {member.profileImageUrl ? (
                                <AvatarImage src={member.profileImageUrl} />
                              ) : (
                                <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                  {member.username?.substring(0, 2).toUpperCase() || 'U'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.username}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={member.companyRole === 'admin' ? 'default' : 'outline'}>
                              {member.companyRole === 'admin' ? 'Admin' : 'Member'}
                            </Badge>
                            {member.companyRole !== 'admin' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRemoveMember(member)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
                
                <TabsContent value="license" className="mt-0">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">License Information</h3>
                      <Badge className="bg-indigo-100 text-indigo-600 hover:bg-indigo-200">
                        {formatLicenseType(selectedCompany.licenseType)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 border rounded-md p-4 bg-slate-50">
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground mb-1">Status</h3>
                        <div>
                          {getLicenseStatusBadge(selectedCompany)}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground mb-1">Expiration</h3>
                        <p className="text-sm flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {selectedCompany.licenseExpiryDate 
                            ? new Date(selectedCompany.licenseExpiryDate).toLocaleDateString() 
                            : 'No expiration'}
                        </p>
                      </div>
                      
                      {selectedCompany.licenseKey && (
                        <>
                          <div className="col-span-2">
                            <h3 className="text-xs font-medium text-muted-foreground mb-1">License Key</h3>
                            <div className="font-mono text-xs bg-white p-2 rounded border truncate">
                              {selectedCompany.licenseKey}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-medium mb-2">License Controls</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          onClick={() => toast({ title: "Coming Soon", description: "License management functionality is coming soon" })}
                        >
                          <Shield className="h-3.5 w-3.5 mr-1" />
                          <span>Update License</span>
                        </Button>
                        
                        {selectedCompany.licenseActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={() => toast({ title: "Coming Soon", description: "License suspension functionality is coming soon" })}
                          >
                            <Shield className="h-3.5 w-3.5 mr-1" />
                            <span>Suspend License</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => toast({ title: "Coming Soon", description: "License activation functionality is coming soon" })}
                          >
                            <Shield className="h-3.5 w-3.5 mr-1" />
                            <span>Activate License</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="chat" className="mt-0">
                  {selectedCompany && (
                    <CompanyChat companyId={selectedCompany.id} companyName={selectedCompany.name} />
                  )}
                </TabsContent>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-md border bg-white/80 h-full flex items-center justify-center">
              <CardContent className="p-10 text-center">
                <Building className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No Company Selected</h3>
                <p className="text-sm text-muted-foreground/70 mt-1 mb-6">
                  Select a company from the list to view details
                </p>
                <Button
                  variant="outline"
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  onClick={() => window.location.href = '/company-generator'}
                >
                  <Building className="h-4 w-4 mr-2" />
                  <span>Create New Company</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'deleteCompany' 
                ? 'Delete Company' 
                : 'Remove Member'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'deleteCompany' 
                ? `Are you sure you want to delete "${selectedCompany?.name}"? This action cannot be undone.`
                : `Are you sure you want to remove ${selectedMember?.username} from "${selectedCompany?.name}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmAction}
            >
              {confirmAction === 'deleteCompany' ? 'Delete' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Company Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Company
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editName">Company Name</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="bg-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editIndustry">Industry</Label>
                <Input
                  id="editIndustry"
                  value={editIndustry}
                  onChange={(e) => setEditIndustry(e.target.value)}
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editSize">Company Size</Label>
                <Select value={editSize} onValueChange={setEditSize}>
                  <SelectTrigger id="editSize" className="bg-white">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (1-50)</SelectItem>
                    <SelectItem value="medium">Medium (51-200)</SelectItem>
                    <SelectItem value="large">Large (201-1000)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editColor">Brand Color</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="editColor"
                  type="color" 
                  value={editColor} 
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-12 h-8 p-1"
                />
                <Input 
                  type="text" 
                  value={editColor} 
                  onChange={(e) => setEditColor(e.target.value)}
                  className="bg-white flex-1"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCompany}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
