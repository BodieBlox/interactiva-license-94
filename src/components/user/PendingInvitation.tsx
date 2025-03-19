
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
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
    <Card className="border-primary/30 bg-primary/5 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          <span>Company Invitation</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center mb-4">
          <span className="font-medium">{fromUsername}</span> has invited you to join <span className="font-medium">{companyName}</span>.
        </p>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Accepting this invitation will apply their company branding to your dashboard.
          You won't be able to modify branding settings yourself.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center space-x-4">
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
          className="bg-primary hover:bg-primary/90 flex items-center gap-2"
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
