
import React, { useState, useEffect } from 'react';
import { SideNav } from './SideNav';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ShieldAlert, AlertTriangle, XCircle, MessageSquare, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { updateUserStatus } from '@/utils/api';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, loading, logout } = useAuth();
  const isMobile = useIsMobile();
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
  const [showContentDelay, setShowContentDelay] = useState(false);

  // For smoother animations, delay showing content
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContentDelay(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Effect to check the user's status and show warning dialog if needed
  useEffect(() => {
    if (user && (user.status === 'warned' || user.status === 'suspended')) {
      setIsWarningDialogOpen(true);
    } else {
      setIsWarningDialogOpen(false);
    }
    
    // Setup a regular check for status changes
    const statusCheck = setInterval(() => {
      // This will trigger a revalidation of the user data
      if (user) {
        console.log('Checking user status:', user.status);
      }
    }, 15000); // Check every 15 seconds
    
    return () => clearInterval(statusCheck);
  }, [user]);
  
  const handleWarningAcknowledge = async () => {
    // If it's just a warning, clear it and set status back to active
    if (user && user.status === 'warned') {
      try {
        await updateUserStatus(user.id, 'active', null);
        setIsWarningDialogOpen(false);
      } catch (error) {
        console.error('Error acknowledging warning:', error);
      }
    }
  };
  
  const handleLogout = () => {
    logout();
    setIsWarningDialogOpen(false);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  const isSuspended = user.status === 'suspended';
  const isWarned = user.status === 'warned';

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/20 ${showContentDelay ? 'animate-fade-in' : 'opacity-0'}`}>
      {!isMobile && <SideNav />}
      
      <main className={`flex-1 transition-all duration-300 ${!isMobile ? 'ml-[260px]' : ''}`}>
        {children}
      </main>
      
      {isMobile && <SideNav />}
      
      {/* Account Suspension/Warning Dialog */}
      <Dialog 
        open={isWarningDialogOpen} 
        onOpenChange={setIsWarningDialogOpen}
        defaultOpen={isWarningDialogOpen}
      >
        <DialogContent className="sm:max-w-md animate-scale-in border-destructive">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              {isSuspended ? (
                <>
                  <ShieldAlert className="h-5 w-5" />
                  Account Suspended
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5" />
                  Account Warning
                </>
              )}
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              {isSuspended ? (
                <>
                  Your account has been suspended by an administrator.
                  <div className="mt-4 p-3 bg-destructive/10 rounded-md border border-destructive/20">
                    <p className="font-medium text-destructive">Reason:</p>
                    <p className="mt-1">{user.warningMessage || "No reason provided."}</p>
                  </div>
                </>
              ) : (
                <>
                  You have received a warning from an administrator.
                  <div className="mt-4 p-3 bg-amber-500/10 rounded-md border border-amber-500/20">
                    <p className="font-medium text-amber-500">Reason:</p>
                    <p className="mt-1">{user.warningMessage || "No reason provided."}</p>
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center my-2">
            {isSuspended ? (
              <div className="w-full p-4 rounded-md bg-muted/50 flex flex-col items-center">
                <ShieldAlert className="h-10 w-10 text-destructive mb-3 animate-pulse" />
                <p className="text-center mb-2">
                  Please contact support for assistance with your account suspension.
                </p>
                <Button
                  variant="outline"
                  className="mt-2 w-full border-destructive/30 hover:bg-destructive/10 text-destructive"
                  onClick={() => window.open('mailto:support@license-ai.com')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </div>
            ) : (
              <div className="w-full p-4 rounded-md bg-muted/50 flex flex-col items-center">
                <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
                <p className="text-center mb-2">
                  Please acknowledge this warning to continue using your account.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleLogout}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Logout
            </Button>
            
            {!isSuspended && (
              <Button
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                onClick={handleWarningAcknowledge}
              >
                I Understand
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
