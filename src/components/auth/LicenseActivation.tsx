
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { KeyRound, MailPlus, ArrowRight, CheckCircle2, AlertCircle, Building } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getLicenseByKey, assignLicenseToUser, createLicenseRequest } from '@/utils/api';

export const LicenseActivation = () => {
  const [licenseKey, setLicenseKey] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, error } = useAuth();
  const { userCompany, createNewCompany, updateCompanyInfo, refreshCompanyData } = useCompany();
  const navigate = useNavigate();

  const handleLicenseKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    if (value.length > 0) {
      value = value.match(/.{1,4}/g)?.join('-') || value;
    }
    
    if (value.length <= 19) {
      setLicenseKey(value);
    }
  };

  useEffect(() => {
    if (userCompany?.licenseActive) {
      toast({
        title: "License Already Active",
        description: "Your company already has an active license.",
      });
      navigate('/dashboard');
    }
  }, [userCompany, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userCompany?.licenseActive) {
      toast({
        title: "License Already Active",
        description: "Your company already has an active license.",
      });
      navigate('/dashboard');
      return;
    }
    
    const trimmedKey = licenseKey.trim();
    if (!trimmedKey || trimmedKey.length < 19) {
      toast({
        title: "Invalid License Key",
        description: "Please enter a valid license key",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // First check if the license is valid
      const license = await getLicenseByKey(trimmedKey);
      
      if (!license) {
        toast({
          title: "Invalid License",
          description: "The license key you entered does not exist",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      if (license.status !== 'active') {
        toast({
          title: "Inactive License",
          description: `This license is ${license.status}. Please contact support.`,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // If user already has a company, update it with the license key
      if (userCompany) {
        await updateCompanyInfo({
          licenseKey: trimmedKey,
          licenseId: license.id,
          licenseType: license.type,
          licenseActive: true,
          licenseExpiryDate: license.expiresAt
        });
        
        // Assign license to the user
        if (user) {
          await assignLicenseToUser(user.id, trimmedKey);
        }
        
        await refreshCompanyData();
        toast({
          title: "Success",
          description: "License key activated for your company successfully",
        });
        navigate('/dashboard');
      } else {
        // If user doesn't have a company, create one
        if (!companyName.trim()) {
          toast({
            title: "Company Name Required",
            description: "Please enter a company name to activate your license",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        await createNewCompany({
          name: companyName,
          licenseKey: trimmedKey,
          licenseId: license.id,
          licenseType: license.type,
          licenseActive: true,
          licenseExpiryDate: license.expiresAt
        });
        
        // Assign license to the user
        if (user) {
          await assignLicenseToUser(user.id, trimmedKey);
        }
        
        toast({
          title: "Success",
          description: "Company created and license key activated successfully",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('License activation error:', error);
      toast({
        title: "Error",
        description: "Failed to activate license key",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim() && !userCompany) {
      toast({
        title: "Company Name Required",
        description: "Please enter a company name to request a license",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to request a license",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      let companyId = userCompany?.id;
      
      // If user doesn't have a company, create one
      if (!companyId) {
        const newCompany = await createNewCompany({
          name: companyName
        });
        companyId = newCompany?.id;
      }
      
      if (companyId && user) {
        // Create a license request
        await createLicenseRequest(
          companyId, 
          user.username || user.email.split('@')[0], 
          user.email, 
          requestMessage
        );
        
        setShowRequestForm(false);
        setRequestMessage('');
        toast({
          title: "License Requested",
          description: "Your company license request has been submitted successfully",
        });
        navigate('/dashboard');
      } else {
        throw new Error("Failed to create company or user not found");
      }
    } catch (error) {
      console.error('License request error:', error);
      toast({
        title: "Error",
        description: "Failed to request company license",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userCompany?.licenseActive) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12">
        <Card className="shadow-lg border border-slate-200 bg-white overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-b from-white to-slate-50 pb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 shadow-md">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-semibold text-slate-800">Company License Active</CardTitle>
            <CardDescription className="text-slate-500">
              Your company already has an active license
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-4 px-6 py-5 bg-slate-50 border-t border-slate-100">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {!showRequestForm ? (
        <form onSubmit={handleSubmit} className="w-full">
          <Card className="shadow-lg border border-slate-200 bg-white overflow-hidden">
            <CardHeader className="text-center bg-gradient-to-b from-white to-slate-50 pb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-md">
                <KeyRound className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-800">Activate Company License</CardTitle>
              <CardDescription className="text-slate-500">
                Enter your company license key to access the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4 px-6">
              {!userCompany && (
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium">Company Name</Label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      placeholder="Enter your company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-white"
                      required
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="licenseKey" className="text-sm font-medium">License Key</Label>
                <Input
                  id="licenseKey"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={handleLicenseKeyChange}
                  className="bg-white shadow-sm border-slate-200 text-center tracking-wider font-mono uppercase transition-all focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  maxLength={19}
                  required
                />
                <p className="text-xs text-center text-slate-500 mt-2">
                  For demo, use: COMP-1234-5678-9ABC
                </p>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 px-6 py-5 bg-slate-50 border-t border-slate-100">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mx-auto"></div>
                ) : (
                  <div className="flex items-center justify-center">
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Activate License
                  </div>
                )}
              </Button>
              
              <div className="relative w-full py-2">
                <Separator className="absolute inset-0 m-auto" />
                <span className="relative bg-slate-50 px-2 text-xs text-slate-400 mx-auto flex">OR</span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-200 hover:bg-slate-100 hover:text-indigo-600 transition-all"
                onClick={() => setShowRequestForm(true)}
                disabled={isSubmitting}
              >
                <MailPlus className="mr-2 h-4 w-4" />
                Request a Company License
              </Button>
            </CardFooter>
          </Card>
        </form>
      ) : (
        <form onSubmit={handleRequestLicense} className="w-full">
          <Card className="shadow-lg border border-slate-200 bg-white overflow-hidden">
            <CardHeader className="text-center bg-gradient-to-b from-white to-slate-50 pb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-md">
                <MailPlus className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-800">Request Company License</CardTitle>
              <CardDescription className="text-slate-500">
                Submit a license request for your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4 px-6">
              {!userCompany && (
                <div className="space-y-2">
                  <Label htmlFor="requestCompanyName" className="text-sm font-medium">Company Name</Label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="requestCompanyName"
                      placeholder="Enter your company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-white"
                      required
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="requestMessage" className="text-sm font-medium">Message (Optional)</Label>
                <Input
                  id="requestMessage"
                  placeholder="Why your company needs access..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="bg-white shadow-sm border-slate-200 transition-all focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 px-6 py-5 bg-slate-50 border-t border-slate-100">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mx-auto"></div>
                ) : (
                  <div className="flex items-center justify-center">
                    <MailPlus className="mr-2 h-5 w-5" />
                    Submit Request
                  </div>
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-all"
                onClick={() => setShowRequestForm(false)}
                disabled={isSubmitting}
              >
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Back to Activation
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
};
