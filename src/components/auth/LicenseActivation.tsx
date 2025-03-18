
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { KeyRound } from 'lucide-react';

export const LicenseActivation = () => {
  const [licenseKey, setLicenseKey] = useState('');
  const { activateUserLicense, isLoading, error } = useAuth();

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
      // Redirection will happen in AppLayout
    } catch (error) {
      console.error('License activation error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <Card className="glass-panel shadow-xl border-0">
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
              onChange={(e) => setLicenseKey(e.target.value)}
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
        </CardFooter>
      </Card>
    </form>
  );
};
