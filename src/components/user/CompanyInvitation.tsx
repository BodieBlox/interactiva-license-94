
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Send, CheckCircle, XCircle, UserPlus, User, Mail, Lock } from 'lucide-react';
import { User as UserType } from '@/utils/types';
import { getUserByEmail, updateDashboardCustomization } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

interface CompanyInvitationProps {
  currentUser: UserType;
}

export const CompanyInvitation = ({ currentUser }: CompanyInvitationProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [invitedUser, setInvitedUser] = useState<UserType | null>(null);
  const { user } = useAuth();

  // Check if current user has approved branding they can share
  const canInviteOthers = user?.customization?.approved && user.customization.companyName;
  
  // Check if user has enterprise license for company features
  const hasEnterpriseLicense = user?.licenseType === 'enterprise' || user?.role === 'admin';

  if (!hasEnterpriseLicense) {
    return (
      <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-500">
            <Lock className="h-5 w-5" />
            Enterprise Feature
          </CardTitle>
          <CardDescription className="text-amber-700 dark:text-amber-400">
            Team management requires an enterprise license
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center gap-2 py-4">
            <Users className="h-12 w-12 text-amber-500/50" />
            <p className="text-amber-800 dark:text-amber-500">
              Inviting team members is available only with an enterprise license.
            </p>
            <p className="text-sm text-amber-700/80 dark:text-amber-500/80">
              Please upgrade your license or contact your administrator for access.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        ...invitedUser.customization || {},
        pendingInvitation: {
          fromUserId: user.id,
          fromUsername: user.username,
          companyName: user.customization.companyName,
          primaryColor: user.customization.primaryColor,
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

  if (!canInviteOthers) {
    return (
      <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-500">
            <Users className="h-5 w-5" />
            Team Management
          </CardTitle>
          <CardDescription className="text-amber-700 dark:text-amber-400">
            Get your company branding approved to invite team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center gap-2 py-4">
            <UserPlus className="h-12 w-12 text-amber-500/50" />
            <p className="text-amber-800 dark:text-amber-500">
              Your company branding must be approved before you can invite team members.
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
            Team Management
          </CardTitle>
          <CardDescription>
            Invite team members to use your company branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <p className="text-sm mb-2">
              When users accept your invitation:
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>They will use your company's colors and branding</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>They won't be able to modify branding themselves</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Any changes to your branding will apply to them as well</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="inviteEmail">Invite by Email</Label>
            <div className="flex gap-2">
              <Input
                id="inviteEmail"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleInviteSearch}
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to Company</DialogTitle>
            <DialogDescription>
              You are about to invite this user to join your company branding
            </DialogDescription>
          </DialogHeader>
          
          {invitedUser && (
            <div className="space-y-4 py-4">
              <Card className="bg-secondary/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{invitedUser.username}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{invitedUser.email}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <p className="text-sm text-muted-foreground">
                If they accept, they will use your company's branding settings and will not be able to modify it themselves.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleInviteSend} disabled={isLoading}>
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
