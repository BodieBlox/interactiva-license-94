
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { KeyRound, MailPlus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const LicenseActivation = () => {
  const [licenseKey, setLicenseKey] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const { user, activateUserLicense, requestLicense, isLoading, error } = useAuth();
  const navigate = useNavigate();

  // Handle auto-formatting of license key as user types
  const handleLicenseKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-alphanumeric characters
    let value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Insert dashes after every 4 characters
    if (value.length > 4) {
      value = value.match(/.{1,4}/g)?.join('-') || value;
    }
    
    // Limit to 19 characters (16 alphanumeric + 3 dashes)
    if (value.length <= 19) {
      setLicenseKey(value);
    }
  };

  // Use the user data to check if we should redirect
  useEffect(() => {
    if (user?.licenseActive) {
      toast({
        title: "License Active",
        description: "You already have an active license.",
      });
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!licenseKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a license key",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await activateUserLicense(licenseKey);
      toast({
        title: "Success",
        description: "License key activated successfully",
      });
      // Navigate to dashboard after successful activation
      navigate('/dashboard');
    } catch (error) {
      console.error('License activation error:', error);
    }
  };

  const handleRequestLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestLicense(requestMessage);
      setShowRequestForm(false);
      setRequestMessage('');
      toast({
        title: "License Requested",
        description: "Your license request has been submitted successfully",
      });
    } catch (error) {
      console.error('License request error:', error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!showRequestForm ? (
        <form onSubmit={handleSubmit} className="w-full">
          <Card className="shadow-lg border border-slate-200 bg-white overflow-hidden">
            <CardHeader className="text-center bg-gradient-to-b from-white to-slate-50 pb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-md">
                <KeyRound className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-800">Activate License</CardTitle>
              <CardDescription className="text-slate-500">
                Enter your license key to access the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4 px-6">
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
                  For demo, use: FREE-1234-5678-9ABC
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 px-6 py-5 bg-slate-50 border-t border-slate-100">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mx-auto"></div>
                ) : (
                  <div className="flex items-center justify-center">
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Activate License
                  </div>
                )}
              </Button>
              {error && (
                <p className="text-sm text-red-500 animate-fade-in">{error}</p>
              )}
              
              <div className="relative w-full py-2">
                <Separator className="absolute inset-0 m-auto" />
                <span className="relative bg-slate-50 px-2 text-xs text-slate-400 mx-auto flex">OR</span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-200 hover:bg-slate-100 hover:text-indigo-600 transition-all"
                onClick={() => setShowRequestForm(true)}
              >
                <MailPlus className="mr-2 h-4 w-4" />
                Request a License
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
              <CardTitle className="text-2xl font-semibold text-slate-800">Request License</CardTitle>
              <CardDescription className="text-slate-500">
                Submit a license request to administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4 px-6">
              <div className="space-y-2">
                <Label htmlFor="requestMessage" className="text-sm font-medium">Message (Optional)</Label>
                <Input
                  id="requestMessage"
                  placeholder="Why you need access..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="bg-white shadow-sm border-slate-200 transition-all focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 px-6 py-5 bg-slate-50 border-t border-slate-100">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md"
                disabled={isLoading}
              >
                {isLoading ? (
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
