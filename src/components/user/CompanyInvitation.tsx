
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Send, CheckCircle, XCircle } from 'lucide-react';
import { User } from '@/utils/types';
import { getUserByEmail, updateDashboardCustomization } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

interface CompanyInvitationProps {
  currentUser: User;
}

export const CompanyInvitation = ({ currentUser }: CompanyInvitationProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [invitedUser, setInvitedUser] = useState<User | null>(null);
  const { user } = useAuth();

  const handleInviteSearch = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const foundUser = await getUserByEmail(email);
      
      if (!foundUser) {
        toast({
          title: "User not found",
          description: "No user exists with that email address",
          variant: "destructive"
        });
        return;
      }
      
      if (foundUser.id === currentUser.id) {
        toast({
          title: "Error",
          description: "You cannot invite yourself",
          variant: "destructive"
        });
        return;
      }
      
      setInvitedUser(foundUser);
      setShowDialog(true);
      
    } catch (error) {
      console.error('Error searching for user:', error);
      toast({
        title: "Error",
        description: "Failed to search for user",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteSend = async () => {
    if (!invitedUser || !user?.customization?.approved || !user.customization.companyName) {
      toast({
        title: "Error",
        description: "Your company branding must be approved before inviting others",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create company invitation in the invited user's data
      await updateDashboardCustomization(invitedUser.id, {
        ...user.customization,
        approved: false, // Invitation needs to be accepted
        pendingInvitation: {
          fromUserId: user.id,
          fromUsername: user.username,
          companyName: user.customization.companyName,
          timestamp: new Date().toISOString()
        }
      });
      
      toast({
        title: "Invitation Sent",
        description: `${invitedUser.username} has been invited to join your company branding`,
        variant: "success"
      });
      
      setShowDialog(false);
      setEmail('');
      setInvitedUser(null);
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser?.customization?.approved) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-2">
            <Users className="h-8 w-8 text-amber-500" />
            <h3 className="text-lg font-medium text-amber-800 dark:text-amber-400">Company Branding Not Approved</h3>
            <p className="text-amber-700 dark:text-amber-500 text-sm">
              Your company branding must be approved by an administrator before you can invite others.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Invite to Company</span>
          </CardTitle>
          <CardDescription>
            Invite other users to join your company branding. When accepted, they will use your company's colors and logo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">User Email</Label>
              <div className="flex gap-2">
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleInviteSearch}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Invited users will receive a notification and can accept or decline your invitation.
          </p>
        </CardFooter>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="glass-panel border-0">
          <DialogHeader>
            <DialogTitle>Invite to Company</DialogTitle>
            <DialogDescription>
              You are about to invite the following user to join your company branding:
            </DialogDescription>
          </DialogHeader>
          
          {invitedUser && (
            <div className="py-4">
              <div className="bg-primary/10 p-4 rounded-md">
                <p><strong>Username:</strong> {invitedUser.username}</p>
                <p><strong>Email:</strong> {invitedUser.email}</p>
                <p><strong>Role:</strong> {invitedUser.role}</p>
              </div>
              
              <div className="mt-4">
                <p className="text-sm">
                  If they accept, they will use your company's branding and will not be able to modify it themselves.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleInviteSend} disabled={isLoading} className="bg-primary hover:bg-primary/90">
              {isLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
