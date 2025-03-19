
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { KeyRound, MailPlus, ArrowRight, ArrowLeft } from 'lucide-react';
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

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!showRequestForm ? (
        <form onSubmit={handleSubmit} className="w-full">
          <Card className="glass-panel shadow-xl border-0 animate-fade-in">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-medium">Activate License</CardTitle>
              <CardDescription>Enter your license key to access the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="licenseKey">License Key</Label>
                <Input
                  id="licenseKey"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={handleLicenseKeyChange}
                  className="bg-white/50 dark:bg-black/10 border-0 subtle-ring-focus transition-apple text-center tracking-wider font-mono uppercase"
                  maxLength={19}
                  required
                />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  For demo, use: FREE-1234-5678-9ABC
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 transition-apple"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mx-auto"></div>
                ) : (
                  'Activate License'
                )}
              </Button>
              {error && (
                <p className="text-sm text-red-500 animate-fade-in">{error}</p>
              )}
              
              <div className="relative w-full py-2">
                <Separator className="absolute inset-0 m-auto" />
                <span className="relative bg-background dark:bg-background-dark px-2 text-xs text-muted-foreground mx-auto flex">OR</span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full transition-all hover:bg-primary/5"
                onClick={() => setShowRequestForm(true)}
              >
                <MailPlus className="mr-2 h-4 w-4" />
                Request a License
              </Button>
              
              {user && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full transition-all mt-2 text-muted-foreground"
                  onClick={handleBackToDashboard}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>
      ) : (
        <form onSubmit={handleRequestLicense} className="w-full">
          <Card className="glass-panel shadow-xl border-0 animate-fade-in">
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MailPlus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-medium">Request License</CardTitle>
              <CardDescription>Submit a license request to administrators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="requestMessage">Message (Optional)</Label>
                <Input
                  id="requestMessage"
                  placeholder="Why you need access..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="bg-white/50 dark:bg-black/10 border-0 subtle-ring-focus transition-apple"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 transition-apple"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mx-auto"></div>
                ) : (
                  'Submit Request'
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full transition-all"
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
