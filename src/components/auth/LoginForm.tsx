
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Key } from 'lucide-react';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, user, checkLicenseValidity } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);

  // Handle redirection when user logs in
  useEffect(() => {
    const checkUserLicense = async () => {
      if (user) {
        console.log("User authenticated:", user);
        if (!user.licenseActive) {
          // Show license dialog if user doesn't have an active license
          setShowLicenseDialog(true);
          return;
        }
        
        // Check if license is valid
        const needsLicense = await checkLicenseValidity();
        if (needsLicense) {
          setShowLicenseDialog(true);
          return;
        }
        
        // Check if we should redirect to a specific page (from state)
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    };
    
    checkUserLicense();
  }, [user, navigate, location, checkLicenseValidity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log("Attempting login with:", email);
      await login(email, password);
      // Redirection happens in useEffect above
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLicenseActivate = () => {
    setShowLicenseDialog(false);
    navigate('/activate');
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
        <Card className="glass-panel shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-medium">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/50 dark:bg-black/10 border-0 subtle-ring-focus transition-apple"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/50 dark:bg-black/10 border-0 subtle-ring-focus transition-apple"
                required
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
                'Sign In'
              )}
            </Button>
            {error && (
              <p className="text-sm text-red-500 animate-fade-in">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Demo accounts:<br />
              user@example.com (user) | admin@example.com (admin)<br />
              warned@example.com (warned) | suspended@example.com (suspended)
            </p>
          </CardFooter>
        </Card>
      </form>

      {/* License Dialog for users without a license */}
      <AlertDialog open={showLicenseDialog} onOpenChange={setShowLicenseDialog}>
        <AlertDialogContent className="glass-panel border-0">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <span>License Required</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              You need an active license to access this content. Please activate your license to continue.
              <p className="mt-2">If you don't have a license key, you can request one from an administrator.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleLicenseActivate} className="bg-primary hover:bg-primary/90">
              Activate License
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
