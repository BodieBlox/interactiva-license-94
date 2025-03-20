
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle, Building, Users } from 'lucide-react';
import { User, DashboardCustomization } from '@/utils/types';
import { updateDashboardCustomization } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

interface PendingInvitationProps {
  currentUser: User;
}

export const PendingInvitation = ({ currentUser }: PendingInvitationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  
  // Early return if no pending invitation
  if (!currentUser?.customization?.pendingInvitation) {
    return null;
  }
  
  const { fromUsername, companyName } = currentUser.customization.pendingInvitation;

  const handleAcceptInvitation = async () => {
    if (!currentUser?.customization?.pendingInvitation) return;
    
    setIsLoading(true);
    try {
      // Create a new customization object with pendingInvitation removed and approved true
      const updatedCustomization: DashboardCustomization = {
        ...currentUser.customization,
        approved: true,
        pendingInvitation: undefined
      };
      
      // Update the user's customization settings
      const updatedUser = await updateDashboardCustomization(currentUser.id, updatedCustomization);
      
      // Update the user in context
      if (updatedUser) {
        setUser(updatedUser);
        
        toast({
          title: "Invitation Accepted",
          description: `You are now using ${companyName}'s branding`,
          variant: "success"
        });
      } else {
        throw new Error("Failed to update user");
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!currentUser?.customization?.pendingInvitation) return;
    
    setIsLoading(true);
    try {
      // Create a copy of the current customization but without the pendingInvitation
      const updatedCustomization: DashboardCustomization = {
        ...currentUser.customization,
        pendingInvitation: undefined
      };
      
      // Update the user's customization settings
      const updatedUser = await updateDashboardCustomization(currentUser.id, updatedCustomization);
      
      // Update the user in context
      if (updatedUser) {
        setUser(updatedUser);
        
        toast({
          title: "Invitation Declined",
          description: "You have declined the company branding invitation",
        });
      } else {
        throw new Error("Failed to update user");
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-md animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          <span>Company Invitation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row items-center md:gap-4 text-center md:text-left">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-3 md:mb-0">
            <Building className="h-8 w-8 text-primary/70" />
          </div>
          <div>
            <p className="mb-2">
              <span className="font-medium">{fromUsername}</span> has invited you to join <span className="font-medium">{companyName}</span>.
            </p>
            <p className="text-sm text-muted-foreground">
              Accepting this invitation will apply their company branding to your dashboard.
              You won't be able to modify branding settings yourself.
            </p>
          </div>
        </div>
        
        <div className="bg-white/50 dark:bg-black/10 p-4 rounded-lg border border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium">What happens when you accept:</span>
          </div>
          <ul className="space-y-2 text-sm pl-6">
            <li>Your dashboard will use {companyName}'s colors and style</li>
            <li>You won't be able to customize branding yourself</li>
            <li>Any changes made by {fromUsername} will automatically apply to you</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={handleDeclineInvitation}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <div className="h-4 w-4 rounded-full border-2 border-t-current border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          Decline
        </Button>
        <Button 
          onClick={handleAcceptInvitation}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Accept
        </Button>
      </CardFooter>
    </Card>
  );
};
