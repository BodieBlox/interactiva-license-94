
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { User } from '@/utils/types';

interface DashboardHeaderProps {
  user: User | null;
  companyName: string | null;
  onLogout: () => void;
}

export const DashboardHeader = ({ user, companyName, onLogout }: DashboardHeaderProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-center'} mb-6`}>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          {companyName ? 
            `Welcome to ${companyName}` : 
            `Welcome back, ${user?.username || 'User'}`}
        </p>
      </div>
      
      <div className={`flex ${isMobile ? 'justify-between' : 'space-x-3'}`}>
        <div className="flex space-x-2">
          <Link to="/settings">
            <Button 
              className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 
                text-primary hover:text-primary/80 shadow-sm hover:shadow transition-all
                border border-gray-100 dark:border-gray-700"
              size="sm"
            >
              {isMobile ? (
                <Settings className="h-4 w-4" />
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-1" />
                  <span>Settings</span>
                </>
              )}
            </Button>
          </Link>
          
          {user?.role === 'admin' && (
            <Link to="/admin">
              <Button 
                className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500
                  text-white border-none shadow-sm hover:shadow transition-all"
                size="sm"
              >
                {isMobile ? (
                  <Shield className="h-4 w-4" />
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-1" />
                    <span>Admin</span>
                  </>
                )}
              </Button>
            </Link>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          onClick={onLogout} 
          size="sm"
          className="bg-white/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700
            border border-gray-100 dark:border-gray-700"
        >
          {isMobile ? (
            <LogOut className="h-4 w-4" />
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-1" />
              <span>Logout</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
