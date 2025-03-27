
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateLicense, assignLicenseToUser } from '@/utils/api';
import { createCompany } from '@/utils/companyApi';
import { getUserByEmail, updateUser } from '@/utils/api';
import { Building, Users, Key, Palette, UserPlus, Check, Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { User } from '@/utils/types';

export const CompanyCreator = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('small');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [licenseType, setLicenseType] = useState<'basic' | 'premium' | 'enterprise'>('premium');
  const [maxUsers, setMaxUsers] = useState(5);
  const [expirationDays, setExpirationDays] = useState(365);
  const [showExpiration, setShowExpiration] = useState(true);
  const [createWithLicense, setCreateWithLicense] = useState(true);

  const handleCreate = async () => {
    if (!companyName || !ownerEmail) {
      toast({
        title: "Missing Information",
        description: "Please provide a company name and owner email",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // 1. Find user by email to get the owner ID
      const owner = await getUserByEmail(ownerEmail);
      
      if (!owner) {
        toast({
          title: "User Not Found",
          description: `No user found with email: ${ownerEmail}`,
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }

      let licenseResult = null;
      
      // 2. Generate a license for the company if createWithLicense is true
      if (createWithLicense) {
        licenseResult = await generateLicense(
          licenseType, 
          showExpiration ? expirationDays : undefined,
          { maxUsers }
        );
      }

      // 3. Create the company with all details
      const companyData: any = {
        name: companyName,
        description,
        industry,
        size,
        branding: {
          primaryColor,
          logo: '',
          approved: true
        }
      };
      
      // Add license information if available
      if (licenseResult) {
        companyData.licenseKey = licenseResult.key;
        companyData.licenseId = licenseResult.id;
        companyData.licenseType = licenseType;
        companyData.licenseActive = true;
        companyData.licenseExpiryDate = licenseResult.expiresAt;
      }

      const newCompany = await createCompany(companyData, owner.id);

      // 4. Update the owner's user record with company and license information
      const userUpdates: any = { 
        isCompanyAdmin: true,
        customization: {
          companyName,
          primaryColor,
          approved: true,
          isCompanyMember: true
        }
      };
      
      // Add license information to user if available
      if (licenseResult) {
        userUpdates.licenseType = licenseType;
        userUpdates.licenseActive = true;
        userUpdates.licenseKey = licenseResult.key;
        userUpdates.licenseId = licenseResult.id;
        
        // Also register the license with the user
        await assignLicenseToUser(owner.id, licenseResult.key);
      }
      
      await updateUser(owner.id, userUpdates);

      // Success message
      toast({
        title: "Company Created",
        description: `${companyName} has been created successfully${createWithLicense ? ` with a ${licenseType} license` : ''}`,
      });

      // Reset form
      setCompanyName('');
      setDescription('');
      setIndustry('');
      setSize('small');
      setOwnerEmail('');
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: "Error",
        description: `Failed to create company: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card className="shadow-md border bg-white">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building className="h-5 w-5 text-indigo-500" />
            Company Generator
          </CardTitle>
          <CardDescription>
            Create a new company with license and branding
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Details Section */}
            <div className="space-y-4">
              <h3 className="text-md font-medium flex items-center gap-2">
                <Building className="h-4 w-4 text-indigo-500" />
                Company Details
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the company"
                  rows={3}
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g., Technology, Healthcare, etc."
                  className="bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="size">Company Size</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger id="size" className="bg-white">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (1-50 employees)</SelectItem>
                    <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                    <SelectItem value="large">Large (201-1000 employees)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* License & Branding Section */}
            <div className="space-y-4">
              <h3 className="text-md font-medium flex items-center gap-2">
                <Key className="h-4 w-4 text-indigo-500" />
                License & Branding
              </h3>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="license-toggle"
                  checked={createWithLicense}
                  onCheckedChange={setCreateWithLicense}
                />
                <Label htmlFor="license-toggle" className="text-sm">
                  Create with License
                </Label>
              </div>
              
              {createWithLicense && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="licenseType">License Type</Label>
                    <Select
                      value={licenseType}
                      onValueChange={(value) => setLicenseType(value as 'basic' | 'premium' | 'enterprise')}
                    >
                      <SelectTrigger id="licenseType" className="bg-white">
                        <SelectValue placeholder="Select license type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxUsers" className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Maximum Users
                    </Label>
                    <Input 
                      id="maxUsers"
                      type="number" 
                      min="1"
                      value={maxUsers} 
                      onChange={(e) => setMaxUsers(parseInt(e.target.value) || 5)}
                      className="bg-white"
                    />
                    <p className="text-xs text-muted-foreground">Maximum number of users allowed in the company</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="expiration-mode"
                      checked={showExpiration}
                      onCheckedChange={setShowExpiration}
                    />
                    <Label htmlFor="expiration-mode" className="text-sm">
                      Set License Expiration Period
                    </Label>
                  </div>
                  
                  {showExpiration && (
                    <div className="space-y-2">
                      <Label htmlFor="expirationDays">Expiration Period (days)</Label>
                      <Input 
                        id="expirationDays"
                        type="number" 
                        min="1"
                        value={expirationDays} 
                        onChange={(e) => setExpirationDays(parseInt(e.target.value) || 365)}
                        className="bg-white"
                      />
                    </div>
                  )}
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="primaryColor" className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  Primary Brand Color
                </Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="primaryColor"
                    type="color" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <Input 
                    type="text" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="bg-white flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Company Owner Section */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-md font-medium flex items-center gap-2 mb-4">
              <UserPlus className="h-4 w-4 text-indigo-500" />
              Company Owner
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Owner Email *</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="Enter email of company owner"
                className="bg-white"
              />
              <p className="text-xs text-muted-foreground">
                The user with this email will be assigned as company administrator
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 border-t p-6">
          <Button 
            onClick={handleCreate} 
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            disabled={isCreating || !companyName || !ownerEmail}
          >
            {isCreating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-white" />
                Creating Company...
              </>
            ) : (
              <>
                <Building className="mr-2 h-4 w-4" />
                Create Company
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
