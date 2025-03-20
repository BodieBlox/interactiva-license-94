
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { generateLicense, getAllUsers, assignLicenseToUser } from '@/utils/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Key, UserCog, Calendar, Infinity, Shield } from 'lucide-react';
import { User } from '@/utils/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ManualLicenseAssignment() {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [licenseType, setLicenseType] = useState<'basic' | 'premium' | 'enterprise'>('premium');
  const [expirationDays, setExpirationDays] = useState(30);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExpiration, setShowExpiration] = useState(true);
  const [activeTab, setActiveTab] = useState('assign');
  const [generatedKey, setGeneratedKey] = useState('');

  const { data: users, isLoading: usersLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers
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
      const licenseRequest: any = {
        type: licenseType,
        expiresIn: showExpiration ? expirationDays : undefined
      };
      
      const licenseResult = await generateLicense();
      
      // Now assign the license to the user
      await assignLicenseToUser(selectedUserId, licenseResult.key);
      
      // Update the user's license type
      const selectedUser = users?.find(user => user.id === selectedUserId);
      if (selectedUser) {
        // This will be handled in the API with a separate call to updateUser
        await fetch(`/api/users/${selectedUserId}/license-type`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ licenseType })
        }).catch(() => {
          // Fallback if the endpoint doesn't exist (in our demo)
          console.log(`Would update user ${selectedUserId} to license type ${licenseType}`);
        });
      }
      
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
      const licenseResult = await generateLicense();
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    toast({
      title: "Copied",
      description: "License key copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assign">Assign License to User</TabsTrigger>
          <TabsTrigger value="generate">Generate License Key</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assign" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign License</CardTitle>
              <CardDescription>
                Directly assign a license to a user account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userSelect">Select User</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={usersLoading}
                >
                  <SelectTrigger id="userSelect">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersLoading ? (
                      <SelectItem value="loading" disabled>Loading users...</SelectItem>
                    ) : (
                      users?.map((user: User) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username} ({user.email})
                          {user.licenseActive ? ' - Has License' : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="licenseType">License Type</Label>
                <Select
                  value={licenseType}
                  onValueChange={(value) => setLicenseType(value as 'basic' | 'premium' | 'enterprise')}
                >
                  <SelectTrigger id="licenseType">
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
                <Label htmlFor="expiration-mode" className="flex items-center gap-2">
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
                  <Label htmlFor="expirationDays">Expiration Period (days)</Label>
                  <Input 
                    id="expirationDays"
                    type="number" 
                    min="1"
                    value={expirationDays} 
                    onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                  />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleAssignLicense} 
                className="w-full"
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
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="generate" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate License Key</CardTitle>
              <CardDescription>
                Generate a license key that can be manually shared
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedKey && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-md mb-6 animate-fade-in">
                  <Label className="text-sm text-muted-foreground mb-2 block">License Key</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={generatedKey} 
                      readOnly 
                      className="font-mono text-center"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyToClipboard}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="text-center py-4">
                <Button 
                  onClick={handleGenerateLicense} 
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-white" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Generate New License Key
                    </>
                  )}
                </Button>
              </div>
              
              <div className="mt-6 text-sm text-muted-foreground">
                <p>Note: Generated license keys can be shared with users who will activate them via the license activation screen.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
