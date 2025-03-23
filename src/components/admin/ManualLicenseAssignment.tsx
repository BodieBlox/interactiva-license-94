
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateLicense, getUsers, assignLicenseToUser, updateUser } from '@/utils/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Key, UserCog, Calendar, Infinity, Shield, Copy, Check, AlertCircle, Ban } from 'lucide-react';
import { User } from '@/utils/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ManualLicenseAssignment() {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [licenseType, setLicenseType] = useState<'basic' | 'premium' | 'enterprise'>('premium');
  const [expirationDays, setExpirationDays] = useState(30);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [showExpiration, setShowExpiration] = useState(true);
  const [activeTab, setActiveTab] = useState('assign');
  const [generatedKey, setGeneratedKey] = useState('');
  
  const queryClient = useQueryClient();

  const { 
    data: users = [], 
    isLoading: usersLoading, 
    refetch 
  } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string, data: Partial<User> }) => 
      updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "User license has been updated",
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

  const handleAssignLicense = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    try {
      // Generate a new license with proper type and expiration
      const licenseResult = await generateLicense(licenseType, showExpiration ? expirationDays : undefined);
      
      // Now assign the license to the user
      await assignLicenseToUser(selectedUserId, licenseResult.key);
      
      // Update the user's license type and status
      updateUserMutation.mutate({
        userId: selectedUserId,
        data: { 
          licenseType,
          licenseActive: true,
          licenseKey: licenseResult.key
        }
      });
      
      toast({
        title: "License Assigned",
        description: `A ${showExpiration ? 'temporary' : 'permanent'} ${licenseType} license has been assigned to the user`,
      });
      
      // Refresh user data
      refetch();
      
      // Reset the form
      setSelectedUserId('');
    } catch (error) {
      console.error('Error assigning license:', error);
      toast({
        title: "Error",
        description: `Failed to assign license to user: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleGenerateLicense = async () => {
    setIsGenerating(true);
    try {
      const licenseResult = await generateLicense(licenseType, showExpiration ? expirationDays : undefined);
      setGeneratedKey(licenseResult.key);
      
      toast({
        title: "License Generated",
        description: "A new license key has been generated",
      });
    } catch (error) {
      console.error('Error generating license:', error);
      toast({
        title: "Error",
        description: `Failed to generate license: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuspendLicense = async (userId: string) => {
    setIsSuspending(true);
    try {
      // Update the user's license status
      updateUserMutation.mutate({
        userId,
        data: { 
          licenseActive: false,
          status: 'suspended'
        }
      });
      
      toast({
        title: "License Suspended",
        description: `User's license has been suspended`,
      });
    } catch (error) {
      console.error('Error suspending license:', error);
      toast({
        title: "Error",
        description: `Failed to suspend license: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsSuspending(false);
    }
  };

  const handleRevokeLicense = async (userId: string) => {
    try {
      // Update the user's license status
      updateUserMutation.mutate({
        userId,
        data: { 
          licenseActive: false,
          licenseKey: undefined,
          licenseType: undefined
        }
      });
      
      toast({
        title: "License Revoked",
        description: `User's license has been revoked`,
      });
    } catch (error) {
      console.error('Error revoking license:', error);
      toast({
        title: "Error",
        description: `Failed to revoke license: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const handleReactivateLicense = async (userId: string) => {
    try {
      // Update the user's license status
      updateUserMutation.mutate({
        userId,
        data: { 
          licenseActive: true,
          status: 'active'
        }
      });
      
      toast({
        title: "License Reactivated",
        description: `User's license has been reactivated`,
      });
    } catch (error) {
      console.error('Error reactivating license:', error);
      toast({
        title: "Error",
        description: `Failed to reactivate license: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    toast({
      title: "Copied",
      description: "License key copied to clipboard",
    });
  };

  const getLicenseStatusBadge = (user: User) => {
    if (!user.licenseKey) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-500">No License</Badge>;
    }
    
    if (!user.licenseActive) {
      return <Badge variant="outline" className="bg-red-100 text-red-600">Suspended</Badge>;
    }
    
    return <Badge variant="outline" className="bg-green-100 text-green-600">Active</Badge>;
  };

  const getLicenseTypeBadge = (type?: string) => {
    if (!type) return null;
    
    switch(type) {
      case 'basic':
        return <Badge variant="outline" className="bg-blue-100 text-blue-600">Basic</Badge>;
      case 'premium':
        return <Badge variant="outline" className="bg-purple-100 text-purple-600">Premium</Badge>;
      case 'enterprise':
        return <Badge variant="outline" className="bg-amber-100 text-amber-600">Enterprise</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Helper function to safely filter users (fixing type issue)
  const getFilteredUsers = () => {
    return Array.isArray(users) ? users.filter(user => !user.licenseActive || !user.licenseKey) : [];
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1">
          <TabsTrigger value="assign" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Assign License
          </TabsTrigger>
          <TabsTrigger value="manage" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Manage Licenses
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="assign" className="pt-4">
          <Card className="bg-white shadow-sm border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b pb-6">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                <Key className="h-5 w-5 text-indigo-500" />
                Assign License
              </CardTitle>
              <CardDescription>
                Directly assign a license to a user account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="userSelect" className="text-sm font-medium">Select User</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={usersLoading}
                >
                  <SelectTrigger id="userSelect" className="bg-white">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersLoading ? (
                      <SelectItem value="loading" disabled>Loading users...</SelectItem>
                    ) : (
                      getFilteredUsers().map((user: User) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="licenseType" className="text-sm font-medium">License Type</Label>
                <Select
                  value={licenseType}
                  onValueChange={(value) => setLicenseType(value as 'basic' | 'premium' | 'enterprise')}
                >
                  <SelectTrigger id="licenseType" className="bg-white">
                    <SelectValue placeholder="Select license type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-blue-500" />
                        <span>Basic</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="premium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-500" />
                        <span>Premium</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="enterprise">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-amber-500" />
                        <span>Enterprise</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="expiration-mode"
                  checked={showExpiration}
                  onCheckedChange={setShowExpiration}
                />
                <Label htmlFor="expiration-mode" className="flex items-center gap-2 text-sm">
                  {showExpiration ? (
                    <>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Set Expiration Period</span>
                    </>
                  ) : (
                    <>
                      <Infinity className="h-4 w-4 text-muted-foreground" />
                      <span>Perpetual License (No Expiration)</span>
                    </>
                  )}
                </Label>
              </div>
              
              {showExpiration && (
                <div className="space-y-2">
                  <Label htmlFor="expirationDays" className="text-sm font-medium">Expiration Period (days)</Label>
                  <Input 
                    id="expirationDays"
                    type="number" 
                    min="1"
                    value={expirationDays} 
                    onChange={(e) => setExpirationDays(parseInt(e.target.value) || 30)}
                    className="bg-white"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col bg-gray-50/50 border-t p-6">
              <Button 
                onClick={handleAssignLicense} 
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                disabled={isAssigning || !selectedUserId}
              >
                {isAssigning ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-white" />
                    Assigning License...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Assign License
                  </>
                )}
              </Button>
              
              <div className="mt-4 pt-4 border-t border-gray-200 w-full">
                <div className="text-sm text-center text-muted-foreground">
                  Need to generate a key manually?
                </div>
                <Button 
                  onClick={handleGenerateLicense} 
                  variant="outline"
                  disabled={isGenerating}
                  className="mt-2 w-full"
                >
                  {isGenerating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-current" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Generate License Key
                    </>
                  )}
                </Button>
                
                {generatedKey && (
                  <div className="mt-3 bg-white p-3 rounded-md border border-gray-200">
                    <Label className="text-xs text-muted-foreground mb-1 block">License Key</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={generatedKey} 
                        readOnly 
                        className="font-mono text-xs bg-white"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={copyToClipboard}
                        className="shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="manage" className="pt-4">
          <Card className="bg-white shadow-sm border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b pb-6">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                <Shield className="h-5 w-5 text-indigo-500" />
                Manage Licenses
              </CardTitle>
              <CardDescription>
                View and manage user licenses across your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-6 space-y-4">
                  {usersLoading ? (
                    <div className="text-center py-8">
                      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-b-transparent border-indigo-600"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
                    </div>
                  ) : !Array.isArray(users) || users.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                      <h3 className="text-lg font-medium">No users found</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        There are no users in the system to manage
                      </p>
                    </div>
                  ) : (
                    users.map((user: User) => (
                      <div key={user.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-base font-medium">{user.username}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getLicenseStatusBadge(user)}
                            {getLicenseTypeBadge(user.licenseType)}
                          </div>
                        </div>
                        
                        {user.licenseKey && (
                          <div className="mb-3">
                            <div className="text-xs text-muted-foreground mb-1">License Key</div>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 flex-1 overflow-x-auto">
                                {user.licenseKey}
                              </code>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(user.licenseKey || '');
                                  toast({
                                    title: "Copied",
                                    description: "License key copied to clipboard",
                                  });
                                }}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-3">
                          {user.licenseKey && user.licenseActive && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-amber-600 border-amber-200 hover:bg-amber-50"
                              onClick={() => handleSuspendLicense(user.id)}
                              disabled={isSuspending}
                            >
                              <Ban className="h-3.5 w-3.5 mr-1.5" />
                              Suspend
                            </Button>
                          )}
                          
                          {user.licenseKey && !user.licenseActive && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleReactivateLicense(user.id)}
                            >
                              <Check className="h-3.5 w-3.5 mr-1.5" />
                              Reactivate
                            </Button>
                          )}
                          
                          {user.licenseKey && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleRevokeLicense(user.id)}
                            >
                              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                              Revoke
                            </Button>
                          )}
                          
                          {!user.licenseKey && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                              onClick={() => setSelectedUserId(user.id)}
                            >
                              <Key className="h-3.5 w-3.5 mr-1.5" />
                              Assign License
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
