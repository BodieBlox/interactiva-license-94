
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Building, Palette, Upload, Image, Globe, Brush, Layers } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import { uploadImage } from '@/utils/fileUtils';

export const CompanyRebranding = () => {
  const { userCompany, updateCompanyInfo } = useCompany();
  
  const [brandingSettings, setBrandingSettings] = useState({
    name: userCompany?.name || '',
    slogan: userCompany?.branding?.slogan || '',
    logo: userCompany?.branding?.logo || '',
    favicon: userCompany?.branding?.favicon || '',
    primaryColor: userCompany?.branding?.primaryColor || '#6366f1',
    secondaryColor: userCompany?.branding?.secondaryColor || '#f43f5e',
    tertiaryColor: userCompany?.branding?.tertiaryColor || '#10b981',
    fontFamily: userCompany?.branding?.fontFamily || 'Inter',
    customCSS: userCompany?.branding?.customCSS || '',
    customJS: userCompany?.branding?.customJS || '',
    footerText: userCompany?.branding?.footerText || '© 2024 Company Name. All rights reserved.',
    hideBranding: userCompany?.branding?.hideBranding || false
  });
  
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({
    logo: false,
    favicon: false
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBrandingSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (checked: boolean, name: string) => {
    setBrandingSettings(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'logo' | 'favicon') => {
    const files = e.target.files;
    if (!files || files.length === 0 || !userCompany?.id) return;
    
    setIsUploading(prev => ({ ...prev, [imageType]: true }));
    try {
      const file = files[0];
      const imageUrl = await uploadImage(file, `company-branding/${userCompany.id}/${imageType}`);
      
      if (imageUrl) {
        setBrandingSettings(prev => ({ ...prev, [imageType]: imageUrl }));
        toast({
          title: "Upload Success",
          description: `Company ${imageType} uploaded successfully`,
        });
      }
    } catch (error) {
      console.error(`Error uploading ${imageType}:`, error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload company ${imageType}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsUploading(prev => ({ ...prev, [imageType]: false }));
    }
  };
  
  const handleSaveRebranding = async () => {
    try {
      const updatedData = {
        name: brandingSettings.name,
        branding: {
          slogan: brandingSettings.slogan,
          logo: brandingSettings.logo,
          favicon: brandingSettings.favicon,
          primaryColor: brandingSettings.primaryColor,
          secondaryColor: brandingSettings.secondaryColor,
          tertiaryColor: brandingSettings.tertiaryColor,
          fontFamily: brandingSettings.fontFamily,
          customCSS: brandingSettings.customCSS,
          customJS: brandingSettings.customJS,
          footerText: brandingSettings.footerText,
          hideBranding: brandingSettings.hideBranding,
          approved: true
        }
      };
      
      await updateCompanyInfo(updatedData);
      
      toast({
        title: "Rebranding Saved",
        description: "Your company branding changes have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving rebranding:', error);
      toast({
        title: "Error",
        description: "Failed to save branding changes. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const isEnterpriseCompany = userCompany?.licenseType === 'enterprise';
  
  if (!isEnterpriseCompany) {
    return (
      <Card className="bg-amber-900/20 border-amber-700/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-300">
            <Building className="h-5 w-5" />
            Enterprise Feature
          </CardTitle>
          <CardDescription className="text-amber-400/80">
            Complete rebranding requires an enterprise license
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center gap-2 py-4">
            <Palette className="h-12 w-12 text-amber-500/30" />
            <p className="text-amber-300">
              Advanced white-labeling and complete rebranding features are only available with an enterprise license.
            </p>
            <p className="text-sm text-amber-400/80">
              Please upgrade your license to access these features.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Complete Company Rebranding
        </CardTitle>
        <CardDescription>
          Customize the platform with your company branding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic">
          <TabsList className="mb-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Brush className="h-4 w-4" />
              Visual Style
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={brandingSettings.name}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="slogan">Company Slogan/Tagline</Label>
                <Input
                  id="slogan"
                  name="slogan"
                  value={brandingSettings.slogan}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="logo">Company Logo</Label>
                  <div className="mt-2">
                    {brandingSettings.logo ? (
                      <div className="mb-2">
                        <img 
                          src={brandingSettings.logo} 
                          alt={brandingSettings.name} 
                          className="h-16 object-contain rounded border border-border/50 p-1"
                        />
                      </div>
                    ) : null}
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isUploading.logo}
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      {isUploading.logo ? (
                        <div className="h-4 w-4 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {brandingSettings.logo ? 'Change Logo' : 'Upload Logo'}
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'logo')}
                        disabled={isUploading.logo}
                      />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="favicon">Favicon</Label>
                  <div className="mt-2">
                    {brandingSettings.favicon ? (
                      <div className="mb-2">
                        <img 
                          src={brandingSettings.favicon} 
                          alt="Favicon" 
                          className="h-8 w-8 object-contain rounded border border-border/50 p-1"
                        />
                      </div>
                    ) : null}
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isUploading.favicon}
                      onClick={() => document.getElementById('favicon-upload')?.click()}
                    >
                      {isUploading.favicon ? (
                        <div className="h-4 w-4 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
                      ) : (
                        <Image className="h-4 w-4 mr-2" />
                      )}
                      {brandingSettings.favicon ? 'Change Favicon' : 'Upload Favicon'}
                      <input
                        id="favicon-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'favicon')}
                        disabled={isUploading.favicon}
                      />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="footerText">Footer Text</Label>
                <Input
                  id="footerText"
                  name="footerText"
                  value={brandingSettings.footerText}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="visual">
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex mt-1">
                    <div 
                      className="w-8 h-8 rounded-l border-y border-l" 
                      style={{ backgroundColor: brandingSettings.primaryColor }}
                    />
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="text"
                      value={brandingSettings.primaryColor}
                      onChange={handleChange}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex mt-1">
                    <div 
                      className="w-8 h-8 rounded-l border-y border-l" 
                      style={{ backgroundColor: brandingSettings.secondaryColor }}
                    />
                    <Input
                      id="secondaryColor"
                      name="secondaryColor"
                      type="text"
                      value={brandingSettings.secondaryColor}
                      onChange={handleChange}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="tertiaryColor">Tertiary Color</Label>
                  <div className="flex mt-1">
                    <div 
                      className="w-8 h-8 rounded-l border-y border-l" 
                      style={{ backgroundColor: brandingSettings.tertiaryColor }}
                    />
                    <Input
                      id="tertiaryColor"
                      name="tertiaryColor"
                      type="text"
                      value={brandingSettings.tertiaryColor}
                      onChange={handleChange}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <select
                  id="fontFamily"
                  name="fontFamily"
                  value={brandingSettings.fontFamily}
                  onChange={(e) => setBrandingSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Lato">Lato</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Raleway">Raleway</option>
                  <option value="Poppins">Poppins</option>
                </select>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hideBranding">Hide Original Branding</Label>
                  <Switch
                    id="hideBranding"
                    checked={brandingSettings.hideBranding}
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'hideBranding')}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Remove all original platform branding and completely replace with your own
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced">
            <div className="space-y-4">
              <div>
                <Label htmlFor="customCSS">Custom CSS</Label>
                <Textarea
                  id="customCSS"
                  name="customCSS"
                  value={brandingSettings.customCSS}
                  onChange={handleChange}
                  className="mt-1 font-mono h-32"
                  placeholder="/* Add your custom CSS here */"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add custom CSS to override default styles
                </p>
              </div>
              
              <div>
                <Label htmlFor="customJS">Custom JavaScript</Label>
                <Textarea
                  id="customJS"
                  name="customJS"
                  value={brandingSettings.customJS}
                  onChange={handleChange}
                  className="mt-1 font-mono h-32"
                  placeholder="// Add your custom JavaScript here"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add custom JavaScript to enhance functionality
                </p>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-800/50">
                <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start">
                  <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Custom code is executed in the browser and can affect your application's performance and security. Use with caution.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSaveRebranding}>
          Save Branding Changes
        </Button>
      </CardFooter>
    </Card>
  );
};
