
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Home, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Shield, 
  Menu, 
  X,
  ChevronRight,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem = ({ to, icon, label, isActive, onClick }: NavItemProps) => (
  <Link to={to} onClick={onClick}>
    <div
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
      )}
    >
      {icon}
      <span className="animate-fade-in">{label}</span>
      {isActive && (
        <ChevronRight className="ml-auto h-4 w-4 text-primary animate-slide-in" />
      )}
    </div>
  </Link>
);

export const SideNav = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = () => {
    logout();
  };

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background z-10">
        <div className="flex items-center justify-around py-2">
          <Link to="/dashboard" className="flex flex-col items-center p-2">
            <Home className={cn("h-5 w-5", isActive('/dashboard') ? "text-primary" : "text-muted-foreground")} />
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Link to="/chat/new" className="flex flex-col items-center p-2">
            <MessageSquare className={cn("h-5 w-5", isActive('/chat') ? "text-primary" : "text-muted-foreground")} />
            <span className="text-xs mt-1">Chat</span>
          </Link>
          
          {user?.role === 'admin' && (
            <Link to="/admin" className="flex flex-col items-center p-2">
              <Shield className={cn("h-5 w-5", isActive('/admin') ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs mt-1">Admin</span>
            </Link>
          )}
          
          <Link to="/settings" className="flex flex-col items-center p-2">
            <Settings className={cn("h-5 w-5", isActive('/settings') ? "text-primary" : "text-muted-foreground")} />
            <span className="text-xs mt-1">Settings</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r bg-background transition-transform duration-300 ease-in-out",
      !isSidebarOpen && "transform -translate-x-[200px]"
    )}>
      <div className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/95 px-6 backdrop-blur">
        <div className="flex flex-1 items-center gap-2">
          <span className="flex items-center gap-2 font-semibold tracking-tight animate-fade-in">
            <Key className="h-5 w-5 text-primary" />
            LicenseAI
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto py-4 px-4">
        <div className="space-y-1.5">
          <NavItem
            to="/dashboard"
            icon={<Home className="h-5 w-5" />}
            label="Dashboard"
            isActive={isActive('/dashboard')}
          />
          <NavItem
            to="/chat/new"
            icon={<MessageSquare className="h-5 w-5" />}
            label="Chat"
            isActive={isActive('/chat')}
          />
          {!user?.licenseActive && (
            <NavItem
              to="/activate"
              icon={<Key className="h-5 w-5" />}
              label="Activate License"
              isActive={isActive('/activate')}
            />
          )}
          {user?.role === 'admin' && (
            <NavItem
              to="/admin"
              icon={<Shield className="h-5 w-5" />}
              label="Admin Panel"
              isActive={isActive('/admin')}
            />
          )}
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-1.5">
          <NavItem
            to="/settings"
            icon={<Settings className="h-5 w-5" />}
            label="Settings"
            isActive={isActive('/settings')}
          />
          <div onClick={handleLogout}>
            <NavItem
              to="#"
              icon={<LogOut className="h-5 w-5" />}
              label="Logout"
              isActive={false}
            />
          </div>
        </div>
      </div>
      
      <div className="sticky bottom-0 z-20 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-medium text-primary">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 truncate">
            <div className="text-sm font-medium">{user?.username || 'User'}</div>
            <div className="truncate text-xs text-muted-foreground">{user?.email || 'user@example.com'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
