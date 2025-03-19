
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { NotificationBanner } from '@/components/ui/NotificationBanner';
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
import { ShieldAlert, AlertTriangle, Key } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireLicense?: boolean;
}

export const AppLayout = ({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireLicense = false
}: AppLayoutProps) => {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showWarning, setShowWarning] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showSuspendedDialog, setShowSuspendedDialog] = useState(false);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);

  useEffect(() => {
    // Only run redirects if we're not loading
    if (isLoading) return;

    if (requireAuth && !user) {
      toast({
        title: "Authentication Required",
        description: "Please login to access this page",
      });
      navigate('/login');
      return;
    }

    if (requireAdmin && user?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Admin privileges required to access this page",
        variant: "destructive"
      });
      navigate('/dashboard');
      return;
    }

    // Skip license check for admin users going to admin pages
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isActivationRoute = location.pathname === '/activate';
    
    if (requireLicense && user && !user.licenseActive && !(user.role === 'admin' && isAdminRoute)) {
      if (!isActivationRoute) {
        // If not already on the activate page, show license dialog
        setShowLicenseDialog(true);
      }
      return;
    } else {
      // Close license dialog if shown but no longer needed
      setShowLicenseDialog(false);
    }

    // Handle suspended users - they can't access the system
    if (user && user.status === 'suspended') {
      setShowSuspendedDialog(true);
      return;
    }

    // Handle warned users - they can access the system but see a warning
    if (user && user.status === 'warned') {
      setShowWarningDialog(true);
    }

    // If we're on login page and already authenticated, redirect to dashboard
    if (location.pathname === '/login' && user) {
      navigate('/dashboard');
      return;
    }

    // Show warning notification if the user has a warning
    if (user && user.status === 'warned') {
      setShowWarning(true);
    }
  }, [isLoading, user, requireAuth, requireAdmin, requireLicense, navigate, location.pathname]);

  const handleWarningContinue = () => {
    setShowWarningDialog(false);
  };

  const handleSuspendedLogout = () => {
    setShowSuspendedDialog(false);
    logout();
  };

  const handleLicenseActivate = () => {
    setShowLicenseDialog(false);
    navigate('/activate');
  };

  // Only show loader if authentication is in progress AND we need auth for this page
  if (isLoading && (requireAuth || requireAdmin || requireLicense)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {/* Warning Banner */}
      {showWarning && user?.warningMessage && (
        <NotificationBanner 
          type="warning" 
          message={user.warningMessage}
          onClose={() => setShowWarning(false)}
        />
      )}
      
      {/* Warning Dialog for warned users */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent className="glass-panel border-0">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Account Warning</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {user?.warningMessage || "Your account has received a warning from an administrator."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleWarningContinue} className="bg-amber-500 hover:bg-amber-600">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Suspended Dialog for suspended users */}
      <AlertDialog open={showSuspendedDialog} onOpenChange={setShowSuspendedDialog}>
        <AlertDialogContent className="glass-panel border-0">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              <span>Account Suspended</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {user?.warningMessage || "Your account has been suspended by an administrator."}
              <p className="mt-2">Please contact support for assistance.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSuspendedLogout} className="bg-red-500 hover:bg-red-600">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="min-h-screen">
        {!showSuspendedDialog && children}
      </div>
    </>
  );
};
