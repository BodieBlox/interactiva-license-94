
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { User as UserType } from '@/utils/types';
import { updateDashboardCustomization } from '@/utils/api';
import { Clock, Check, X, Building } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface PendingInvitationProps {
  currentUser: UserType;
}

export const PendingInvitation = ({ currentUser }: PendingInvitationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  
  if (!currentUser.customization?.pendingInvitation) {
    return null;
  }
  
  const { fromUsername, companyName, timestamp, primaryColor } = currentUser.customization.pendingInvitation;
  const formattedDate = new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const handleAcceptInvitation = async () => {
    setIsLoading(true);
    try {
      // Prepare customization with all required fields and no undefined values
      const updatedCustomization = {
        ...(currentUser.customization || {}),
        companyName: companyName,
        primaryColor: primaryColor || '#6366f1', // Default to indigo if not provided
        isCompanyMember: true,
      };
      
      // Remove the pending invitation explicitly
      delete updatedCustomization.pendingInvitation;
      
      const updatedUser = await updateDashboardCustomization(currentUser.id, updatedCustomization);
      
      // Update licenseType to 'enterprise' when joining a company
      // Important: using the specific type value from the union type
      const userWithLicense = {
        ...updatedUser,
        licenseType: 'enterprise' as const,
        licenseActive: true // Set license as active since they're on company license now
      };
      setUser(userWithLicense);
      
      toast({
        title: "Invitation Accepted",
        description: `You are now part of ${companyName}`,
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: `Failed to accept invitation: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeclineInvitation = async () => {
    setIsLoading(true);
    try {
      const updatedUser = await updateDashboardCustomization(currentUser.id, {
        ...currentUser.customization,
        pendingInvitation: undefined
      });
      
      setUser(updatedUser);
      
      toast({
        title: "Invitation Declined",
        description: "You have declined the company invitation",
      });
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: "Error",
        description: `Failed to decline invitation: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          Company Invitation
        </CardTitle>
        <CardDescription>
          You've been invited to join a company
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="p-3 bg-background rounded-md border">
            <p className="font-medium">{companyName}</p>
            <div className="flex items-center text-sm text-muted-foreground gap-1 mt-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Invited by {fromUsername} on {formattedDate}</span>
            </div>
          </div>
          
          <p className="text-sm">
            Accepting this invitation will apply the company's branding to your dashboard.
            You'll receive their enterprise license benefits but won't be able to modify branding settings.
          </p>
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleDeclineInvitation}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              ) : (
                <X className="h-4 w-4 mr-1" />
              )}
              Decline
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleAcceptInvitation}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Accept
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
