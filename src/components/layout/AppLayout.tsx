
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { NotificationBanner } from '@/components/ui/NotificationBanner';

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
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !user) {
      navigate('/login');
      return;
    }

    if (requireAdmin && user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    if (requireLicense && user && !user.licenseActive) {
      navigate('/activate-license');
      return;
    }

    // Show warning notification if the user has a warning or is suspended
    if (user && (user.status === 'warned' || user.status === 'suspended')) {
      setShowWarning(true);
    }
  }, [isLoading, user, requireAuth, requireAdmin, requireLicense, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {showWarning && user?.warningMessage && (
        <NotificationBanner 
          type={user.status === 'warned' ? 'warning' : 'error'} 
          message={user.warningMessage}
          onClose={() => setShowWarning(false)}
        />
      )}
      <div className="min-h-screen">
        {children}
      </div>
    </>
  );
};
