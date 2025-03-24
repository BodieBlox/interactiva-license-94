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
import { Moon, Sun, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const AppLayout = () => {
  const { user, signOut } = useAuth();
  const { userCompany } = useCompany();
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-screen flex justify-center items-center">Loading...</div>;
  }

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
            signOut();
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
  }, [user]);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="w-full h-14 md:h-16 flex items-center justify-between py-2 px-4 border-b">
          <div className="flex items-center sm:hidden">
            <label
              htmlFor="mobile-sidebar-drawer"
              className="btn btn-ghost mr-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </label>
            <h1 className="text-xl font-semibold">
              {userCompany?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.image} alt={user?.username} />
                    <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
