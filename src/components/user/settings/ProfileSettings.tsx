
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Check, Loader2, User, Mail, Key } from 'lucide-react';
import { updateUser } from '@/utils/api';
import { sanitizeUserData } from '@/utils/companyTypes';

export const ProfileSettings = () => {
  const { user, setUser } = useAuth();
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUsername.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    try {
      if (!user?.id) {
        throw new Error("User ID is missing");
      }
      
      // Use sanitizeUserData to ensure no undefined values
      const userData = sanitizeUserData({ username: newUsername });
      const updatedUser = await updateUser(user.id, userData);
      
      // Update the user in context with new username
      if (user && updatedUser) {
        setUser({
          ...user,
          username: updatedUser.username || newUsername
        });
      }
      
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
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user?.email}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your email cannot be changed
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="license" className="text-muted-foreground">License Key</Label>
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user?.licenseKey || 'No license'}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {user?.licenseActive ? 'License active' : 'No active license'}
              </p>
            </div>
          </div>

          <form onSubmit={handleUsernameUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="bg-white/50 dark:bg-black/10"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isSaving || newUsername === user?.username || !newUsername.trim()}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  <span>Update Profile</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
