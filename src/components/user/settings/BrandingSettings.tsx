
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Building, Lock, Key, Upload, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { uploadImage } from '@/utils/fileUtils';

export const BrandingSettings = () => {
  const { user } = useAuth();
  const { userCompany, updateCompanyLogo } = useCompany();
  const [isUploading, setIsUploading] = useState(false);
  
  const isPartOfCompany = user?.customization?.isCompanyMember || 
    (user?.customization?.companyName && user?.customization?.approved);
  
  const hasActiveLicense = user?.licenseActive && user?.licenseKey;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !userCompany?.id) return;
    
    setIsUploading(true);
    try {
      const file = files[0];
      const logoUrl = await uploadImage(file, `company-logos/${userCompany.id}`);
      
      if (logoUrl) {
        await updateCompanyLogo(userCompany.id, logoUrl);
        toast({
          title: "Logo Updated",
          description: "Your company logo has been updated successfully",
        });
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload company logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Show current license key and type first
  if (hasActiveLicense) {
    return (
      <div className="space-y-6">
        <Card className="bg-blue-900/30 border-blue-700/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Key className="h-5 w-5 text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-blue-300 font-medium">
                Your License: <span className="font-mono">{user.licenseKey}</span>
              </p>
              <p className="text-sm text-blue-400/80">
                Type: {user.licenseType || 'Standard'} · Status: Active
              </p>
            </div>
          </CardContent>
        </Card>

        {isPartOfCompany ? (
          <Card className="bg-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Company Managed
              </CardTitle>
              <CardDescription>
                Your branding is managed by your company administrator
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6 text-center">
              <div className="bg-background/50 p-4 rounded-lg border border-border/50 mb-4 w-full max-w-md">
                {userCompany?.branding?.logo ? (
                  <div className="mb-3 flex justify-center">
                    <img 
                      src={userCompany.branding.logo} 
                      alt={user?.customization?.companyName || 'Company logo'} 
                      className="h-16 object-contain rounded border border-border/50 p-1"
                    />
                  </div>
                ) : null}
                
                <p className="font-medium">
                  Company: {user?.customization?.companyName || 'Not specified'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div 
                    className="h-4 w-4 rounded-full" 
                    style={{ backgroundColor: user?.customization?.primaryColor || '#6366f1' }} 
                  />
                  <span className="text-sm text-muted-foreground">
                    {user?.customization?.primaryColor || 'Default color'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Your dashboard branding is managed by your company administrator. You cannot modify these settings yourself.
              </p>
            </CardContent>
          </Card>
        ) : user?.isCompanyAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Company Branding Settings
              </CardTitle>
              <CardDescription>
                Manage your company's branding settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  Company Logo
                </h3>
                
                {userCompany?.branding?.logo ? (
                  <div className="mb-3 flex justify-center">
                    <img 
                      src={userCompany.branding.logo} 
                      alt={userCompany.name} 
                      className="h-20 object-contain rounded border border-border/50 p-1"
                    />
                  </div>
                ) : (
                  <div className="mb-3 flex justify-center">
                    <div className="h-20 w-40 flex items-center justify-center border border-dashed rounded-md text-muted-foreground bg-muted/20">
                      <span className="text-sm">No logo uploaded</span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={isUploading}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    {isUploading ? (
                      <div className="h-4 w-4 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {userCompany?.branding?.logo ? 'Update Logo' : 'Upload Logo'}
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                    />
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Brand Color</h3>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-6 w-6 rounded-full" 
                    style={{ backgroundColor: userCompany?.branding?.primaryColor || '#6366f1' }} 
                  />
                  <span>{userCompany?.branding?.primaryColor || 'Default color'}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  To update brand color, go to the Company Management section.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                Company Branding
              </CardTitle>
              <CardDescription>
                Company branding can only be managed by administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-6">
              <Building className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="max-w-md mx-auto">
                Company branding allows customization of your dashboard with company colors and logo. 
                Please contact an administrator to be added to a company.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } else {
    // If no license, just show a message
    return (
      <Card className="bg-amber-900/30 border-amber-700/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-400" />
            License Required
          </CardTitle>
          <CardDescription className="text-amber-400/80">
            You need an active license to access branding features
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6 text-center">
          <Building className="h-16 w-16 text-amber-500/20 mb-4" />
          <p className="text-amber-300">
            Please activate a license to access branding features.
          </p>
        </CardContent>
      </Card>
    );
  }
};
