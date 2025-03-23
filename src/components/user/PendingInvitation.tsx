
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { User as UserType } from '@/utils/types';
import { updateDashboardCustomization, updateUser, assignLicense } from '@/utils/api';
import { Clock, Check, X, Building } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { acceptCompanyInvitation, declineCompanyInvitation } from '@/utils/companyApi';
import { sanitizeCustomizationData } from '@/utils/companyTypes';

interface PendingInvitationProps {
  currentUser: UserType;
}

export const PendingInvitation = ({ currentUser }: PendingInvitationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  
  if (!currentUser.customization?.pendingInvitation) {
    return null;
  }
  
  const { fromUsername, companyName, timestamp, primaryColor, logo, companyId } = currentUser.customization.pendingInvitation;
  const formattedDate = new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const handleAcceptInvitation = async () => {
    setIsLoading(true);
    try {
      // Accept the invitation via the API
      await acceptCompanyInvitation(
        currentUser.customization?.pendingInvitation?.id || '',
        currentUser.id
      );
      
      // Prepare customization without undefined values
      const updatedCustomization = sanitizeCustomizationData({
        companyName: companyName || '',
        companyId: companyId || '',
        primaryColor: primaryColor || '#7E69AB',
        logo: logo || '',
        isCompanyMember: true,
        approved: true,
      });
      
      // Make a clean copy without the pendingInvitation
      const { pendingInvitation, ...restCustomization } = currentUser.customization || {};
      const cleanCustomization = { ...restCustomization, ...updatedCustomization };
      
      const updatedUser = await updateDashboardCustomization(currentUser.id, cleanCustomization);
      
      // Assign enterprise license
      let licenseData;
      try {
        licenseData = await assignLicense(currentUser.id, 'enterprise');
      } catch (licenseError) {
        console.error('Error assigning license:', licenseError);
        toast({
          title: "License Warning",
          description: "Joined company but couldn't assign license automatically",
          variant: "destructive"
        });
      }
      
      // Update user with license info
      const licenseUpdate = {
        licenseType: 'enterprise' as 'basic' | 'premium' | 'enterprise',
        licenseActive: true,
        licenseKey: licenseData?.key || currentUser.licenseKey,
        licenseId: licenseData?.id || currentUser.licenseId,
        licenseExpiryDate: licenseData?.expiresAt || currentUser.licenseExpiryDate
      };
      
      await updateUser(currentUser.id, licenseUpdate);
      
      // Merge the returned user with license information
      const userWithLicense = {
        ...updatedUser,
        ...licenseUpdate
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
        description: `Failed to accept invitation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeclineInvitation = async () => {
    setIsLoading(true);
    try {
      // Decline the invitation via the API
      await declineCompanyInvitation(
        currentUser.customization?.pendingInvitation?.id || '',
        currentUser.id
      );
      
      // Create a clean copy without pendingInvitation
      const { pendingInvitation, ...restCustomization } = currentUser.customization || {};
      
      const updatedUser = await updateDashboardCustomization(currentUser.id, restCustomization);
      
      setUser(updatedUser);
      
      toast({
        title: "Invitation Declined",
        description: "You have declined the company invitation",
      });
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: "Error",
        description: `Failed to decline invitation: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
            <div className="flex items-center gap-3">
              {logo && (
                <img 
                  src={logo} 
                  alt={companyName} 
                  className="h-10 w-10 object-contain rounded"
                />
              )}
              <div>
                <p className="font-medium">{companyName}</p>
                <div className="flex items-center text-sm text-muted-foreground gap-1 mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Invited by {fromUsername} on {formattedDate}</span>
                </div>
              </div>
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
