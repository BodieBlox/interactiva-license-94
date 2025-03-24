
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Send, CheckCircle, XCircle, UserPlus, User, Mail, Lock, Building, Search, Link, Copy } from 'lucide-react';
import { User as UserType } from '@/utils/types';
import { getUserByEmail, updateDashboardCustomization } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';

interface CompanyInvitationProps {
  currentUser: UserType;
}

export const CompanyInvitation = ({ currentUser }: CompanyInvitationProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [invitedUser, setInvitedUser] = useState<UserType | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { userCompany, generateInviteLink } = useCompany();

  // Check if current user has approved branding they can share and is a company admin
  const canInviteOthers = user?.customization?.approved && 
                          user?.customization?.companyName && 
                          (user?.isCompanyAdmin || user?.role === 'admin');
  
  // Check if user has enterprise license for company features or is an admin
  const hasEnterpriseLicense = user?.licenseType === 'enterprise' || user?.role === 'admin';

  const handleInviteSearch = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
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
      
      // Check if user is already part of a company
      if (foundUser.customization?.companyName) {
        toast({
          title: "User Already in Company",
          description: "This user is already associated with a company",
          variant: "destructive"
        });
        return;
      }
      
      // Check if user already has an invitation
      if (foundUser.customization?.pendingInvitation) {
        toast({
          title: "Invitation Exists",
          description: "This user already has a pending invitation",
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
      setIsSearching(false);
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
      // Create clean customization object for invited user
      const updatedCustomization = {
        ...(invitedUser.customization || {}),
        pendingInvitation: {
          fromUserId: user.id,
          fromUsername: user.username,
          companyName: user.customization.companyName,
          timestamp: new Date().toISOString(),
          primaryColor: user.customization.primaryColor
        }
      };
      
      await updateDashboardCustomization(invitedUser.id, updatedCustomization);
      
      toast({
        title: "Invitation Sent",
        description: `${invitedUser.username} has been invited to join your company`,
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

  const handleGenerateInviteLink = async () => {
    if (!userCompany) {
      toast({
        title: "Error",
        description: "No company found to generate invite link",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingLink(true);
    try {
      const link = await generateInviteLink(userCompany.id);
      setInviteLink(link);
      toast({
        title: "Success",
        description: "Invite link generated successfully",
      });
    } catch (error) {
      console.error('Error generating invite link:', error);
      toast({
        title: "Error",
        description: "Failed to generate invite link",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyInviteLink = () => {
    if (!inviteLink) return;
    
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hasEnterpriseLicense) {
    return (
      <Card className="bg-amber-900/20 border-amber-700/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-300">
            <Lock className="h-5 w-5" />
            Enterprise Feature
          </CardTitle>
          <CardDescription className="text-amber-400/80">
            Team management requires an enterprise license
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center gap-2 py-4">
            <Users className="h-12 w-12 text-amber-500/30" />
            <p className="text-amber-300">
              Inviting team members is available only with an enterprise license.
            </p>
            <p className="text-sm text-amber-400/80">
              Please upgrade your license or contact your administrator for access.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canInviteOthers) {
    return (
      <Card className="bg-amber-900/20 border-amber-700/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Team Management
          </CardTitle>
          <CardDescription>
            Get your company branding approved to invite team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center gap-2 py-4">
            <UserPlus className="h-12 w-12 text-amber-500/30" />
            <p className="text-amber-300">
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
          {/* Company Invite Link Section */}
          <Card className="border border-primary/20 bg-primary/5 mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Link className="h-4 w-4 text-primary" />
                Company Invite Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inviteLink ? (
                <div className="flex items-center gap-2">
                  <Input 
                    value={inviteLink} 
                    readOnly 
                    className="flex-1 text-sm font-mono"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={copyInviteLink}
                    className="flex-shrink-0"
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={handleGenerateInviteLink}
                  disabled={isGeneratingLink}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isGeneratingLink ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  ) : (
                    <Link className="h-4 w-4" />
                  )}
                  <span>Generate Invite Link</span>
                </Button>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Anyone with this link can join your company. The link will expire after 7 days.
              </p>
            </CardContent>
          </Card>
        
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
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>They will receive enterprise license benefits</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="inviteEmail">Invite by Email</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button 
                onClick={handleInviteSearch}
                disabled={isSearching || !email.trim()}
                variant="default"
              >
                {isSearching ? (
                  <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Find User
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
              You are about to invite this user to join your company
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
              
              <div className="bg-secondary/30 p-3 rounded-md text-sm text-muted-foreground">
                <p>
                  If they accept, they will use your company's branding settings and will not be able to modify it themselves.
                  They'll be covered by your enterprise license benefits.
                </p>
              </div>
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
