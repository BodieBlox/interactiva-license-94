
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, LogIn, MessageSquare, Power, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type SystemSettings = {
  loginDisabled: boolean;
  newChatDisabled: boolean;
  platformDisabled: boolean;
};

export const SystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    loginDisabled: false,
    newChatDisabled: false,
    platformDisabled: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('https://orgid-f590b-default-rtdb.firebaseio.com/systemSettings.json');
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setSettings({
              loginDisabled: data.loginDisabled || false,
              newChatDisabled: data.newChatDisabled || false,
              platformDisabled: data.platformDisabled || false,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching system settings:', error);
        toast({
          title: "Error",
          description: "Failed to load system settings",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('https://orgid-f590b-default-rtdb.firebaseio.com/systemSettings.json', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "System settings saved successfully",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast({
        title: "Error",
        description: "Failed to save system settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">System Settings</h2>
        <p className="text-muted-foreground">
          Control global system functionality and access
        </p>
      </div>
      
      {settings.platformDisabled && (
        <Alert variant="destructive" className="animate-pulse">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Platform Disabled</AlertTitle>
          <AlertDescription>
            The platform is currently disabled. Only administrators can access the system.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              <span>Login Access</span>
            </CardTitle>
            <CardDescription>
              Control whether users can log in to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Disable Logins</p>
                <p className="text-sm text-muted-foreground">
                  When enabled, users cannot log in (except administrators)
                </p>
              </div>
              <Switch
                checked={settings.loginDisabled}
                onCheckedChange={(checked) => setSettings({ ...settings, loginDisabled: checked })}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span>Chat Creation</span>
            </CardTitle>
            <CardDescription>
              Control whether users can create new chats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Disable New Chats</p>
                <p className="text-sm text-muted-foreground">
                  When enabled, users cannot create new chat conversations
                </p>
              </div>
              <Switch
                checked={settings.newChatDisabled}
                onCheckedChange={(checked) => setSettings({ ...settings, newChatDisabled: checked })}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="h-5 w-5 text-destructive" />
              <span>Platform Access</span>
            </CardTitle>
            <CardDescription>
              Control whether the entire platform is accessible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">Disable Platform</p>
                <p className="text-sm text-muted-foreground">
                  When enabled, the entire platform is inaccessible except for administrators
                </p>
              </div>
              <Switch
                checked={settings.platformDisabled}
                onCheckedChange={(checked) => setSettings({ ...settings, platformDisabled: checked })}
              />
            </div>
            
            {settings.platformDisabled && (
              <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Enabling this setting will prevent all users except administrators from accessing the platform. 
                  Make sure to communicate this to your users before enabling.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
