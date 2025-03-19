import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { updateUsername, updateDashboardCustomization } from '@/utils/api';
import { DashboardCustomization } from '@/utils/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { User, Palette, Key, Building2, Save, ArrowLeft, RotateCcw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export const UserSettings = () => {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [skipApproval, setSkipApproval] = useState(false);
  const [hasExistingApproval, setHasExistingApproval] = useState(false);
  const [customization, setCustomization] = useState<DashboardCustomization>({
    primaryColor: '#7E69AB',
    companyName: '',
    logo: ''
  });

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      if (user.customization) {
        setCustomization({
          primaryColor: user.customization.primaryColor || '#7E69AB',
          companyName: user.customization.companyName || '',
          logo: user.customization.logo || '',
          approved: user.customization.approved || false
        });
        setHasExistingApproval(user.customization.approved === true);
      }
    }
  }, [user]);

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsLoading(true);
    try {
      const updatedUser = await updateUsername(user.id, username);
      setUser({...user, ...updatedUser});
      toast({
        title: "Success",
        description: "Username updated successfully",
      });
    } catch (error) {
      console.error('Username update error:', error);
      toast({
        title: "Error",
        description: `Failed to update username: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomizationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsLoading(true);
    try {
      const customizationWithApproval = {
        ...customization,
        approved: skipApproval || hasExistingApproval ? true : false
      };
      
      const updatedUser = await updateDashboardCustomization(user.id, customizationWithApproval);
      setUser({...user, ...updatedUser});
      
      if (skipApproval || hasExistingApproval) {
        toast({
          title: "Success",
          description: "Dashboard customization settings saved and applied immediately.",
        });
        setHasExistingApproval(true);
      } else {
        toast({
          title: "Success",
          description: "Dashboard customization settings saved. Changes will be applied after admin approval.",
        });
      }
    } catch (error) {
      console.error('Customization update error:', error);
      toast({
        title: "Error",
        description: `Failed to update customization: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetBranding = () => {
    setCustomization({
      primaryColor: '#7E69AB',
      companyName: '',
      logo: '',
      approved: false
    });
    setSkipApproval(false);
    toast({
      title: "Reset",
      description: "Branding settings have been reset to default values.",
    });
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-medium">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" className="flex items-center gap-2 bg-white dark:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="license" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span>License</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span>Branding</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6 animate-fade-in">
          <Card className="glass-panel shadow-lg border-0">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUsernameUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="bg-white/50 dark:bg-black/10 border-0 subtle-ring-focus transition-apple"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email}
                    className="bg-muted border-0 text-muted-foreground"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90 transition-apple"
                    disabled={isLoading || username === user?.username}
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mx-auto"></div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="license" className="space-y-6 animate-fade-in">
          <Card className="glass-panel shadow-lg border-0">
            <CardHeader>
              <CardTitle>License Information</CardTitle>
              <CardDescription>View your current license details</CardDescription>
            </CardHeader>
            <CardContent>
              {user?.licenseActive ? (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-md p-4">
                    <p className="text-green-800 dark:text-green-300 flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Your license is active
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="licenseKey">License Key</Label>
                    <div className="flex">
                      <Input
                        id="licenseKey"
                        value={user.licenseKey || ''}
                        className="bg-white/50 dark:bg-black/10 border-0 font-mono text-sm rounded-r-none"
                        readOnly
                      />
                      <Button
                        type="button"
                        className="rounded-l-none"
                        onClick={() => {
                          navigator.clipboard.writeText(user.licenseKey || '');
                          toast({
                            title: "Copied",
                            description: "License key copied to clipboard",
                          });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-md p-4">
                  <p className="text-amber-800 dark:text-amber-300">
                    No active license. Please activate a license to access all features.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="branding" className="space-y-6 animate-fade-in">
          <Card className="glass-panel shadow-lg border-0">
            <CardHeader>
              <CardTitle>Dashboard Branding</CardTitle>
              <CardDescription>Customize your dashboard appearance</CardDescription>
            </CardHeader>
            <CardContent>
              {user?.customization?.approved === true ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-md p-4 mb-4">
                  <p className="text-green-800 dark:text-green-300 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Your custom branding is approved and active</span>
                  </p>
                </div>
              ) : user?.customization?.approved === false ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-md p-4 mb-4">
                  <p className="text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Your branding customization is pending approval</span>
                  </p>
                </div>
              ) : null}
              
              <form onSubmit={handleCustomizationUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={customization.companyName}
                    onChange={(e) => setCustomization({...customization, companyName: e.target.value})}
                    placeholder="Enter your company name"
                    className="bg-white/50 dark:bg-black/10 border-0 subtle-ring-focus transition-apple"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Brand Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={customization.primaryColor}
                      onChange={(e) => setCustomization({...customization, primaryColor: e.target.value})}
                      className="w-20 h-10 p-1 bg-white/50 dark:bg-black/10 border-0"
                    />
                    <Input
                      value={customization.primaryColor}
                      onChange={(e) => setCustomization({...customization, primaryColor: e.target.value})}
                      placeholder="#7E69AB"
                      className="bg-white/50 dark:bg-black/10 border-0 subtle-ring-focus transition-apple"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL (optional)</Label>
                  <Input
                    id="logo"
                    value={customization.logo}
                    onChange={(e) => setCustomization({...customization, logo: e.target.value})}
                    placeholder="https://your-company.com/logo.png"
                    className="bg-white/50 dark:bg-black/10 border-0 subtle-ring-focus transition-apple"
                  />
                  <p className="text-xs text-muted-foreground">Enter a URL to your company logo (recommended size: 180x60px)</p>
                </div>
                
                {hasExistingApproval && (
                  <div className="flex items-center justify-between space-x-2 pt-2">
                    <Label htmlFor="skipApproval" className="flex items-center gap-2 cursor-pointer">
                      <span>Apply changes immediately</span>
                      <span className="text-xs text-muted-foreground">(Skip approval)</span>
                    </Label>
                    <Switch
                      id="skipApproval"
                      checked={skipApproval}
                      onCheckedChange={setSkipApproval}
                    />
                  </div>
                )}
                
                <div className="flex justify-between pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={resetBranding}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                  
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90 transition-apple"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mx-auto"></div>
                    ) : (
                      <>
                        <Palette className="h-4 w-4 mr-2" />
                        Save Branding
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground border-t pt-4">
              {!hasExistingApproval ? 
                "Branding changes require admin approval before they take effect." : 
                skipApproval ? 
                  "Changes will be applied immediately without requiring approval." : 
                  "Changes will require admin approval before they take effect."}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
