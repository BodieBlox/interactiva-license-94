import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { ModeToggle } from '../ui/mode-toggle';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, Menu, Moon, Sun, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const { userCompany } = useCompany();
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);

  // Hook to handle mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hook to check platform status
  useEffect(() => {
    const checkPlatformStatus = async () => {
      try {
        const response = await fetch('https://orgid-f590b-default-rtdb.firebaseio.com/systemSettings.json');
        if (response.ok) {
          const data = await response.json();
          if (data && data.platformDisabled && user?.role !== 'admin') {
            toast({
              title: "Platform Unavailable",
              description: "The platform is currently unavailable. Please try again later.",
              variant: "destructive"
            });
            logout();
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Error checking platform status:', error);
      }
    };

    if (user && user.role !== 'admin') {
      checkPlatformStatus();
    }
  }, [user, logout, navigate]);

  // Loading state
  if (!isMounted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="w-full h-16 flex items-center justify-between py-2 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <label
              htmlFor="mobile-sidebar-drawer"
              className="btn btn-ghost lg:hidden hover:bg-accent hover:text-accent-foreground rounded-full p-2 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </label>
            <h1 className="text-xl font-semibold tracking-tight">
              {userCompany?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0 rounded-full ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Avatar className="h-8 w-8 transition-transform hover:scale-105">
                    <AvatarImage src={user?.profileImageUrl} alt={user?.username} />
                    <AvatarFallback className="bg-primary/10">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate('/settings')}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logout()}
                  className="cursor-pointer text-red-500 focus:text-red-500"
                >
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-4">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
