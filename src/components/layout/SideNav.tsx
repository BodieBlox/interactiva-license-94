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
  Key,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  isSidebarOpen?: boolean;
}

const NavItem = ({ to, icon, label, isActive, onClick, isSidebarOpen = true }: NavItemProps) => {
  const content = (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
        isActive 
          ? "bg-primary text-primary-foreground shadow-sm" 
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: cn(
          "h-5 w-5 shrink-0 transition-transform duration-200",
          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground",
          !isSidebarOpen && "transform group-hover:scale-110"
        )
      })}
      {isSidebarOpen && (
        <span className="truncate animate-fade-in">{label}</span>
      )}
      {isActive && isSidebarOpen && (
        <ChevronRight className="ml-auto h-4 w-4 animate-slide-in" />
      )}
    </div>
  );

  return isSidebarOpen ? (
    <Link to={to} onClick={onClick}>
      {content}
    </Link>
  ) : (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={to} onClick={onClick}>
            {content}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

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
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex items-center justify-around py-2 px-4">
          <Link to="/dashboard" className="flex flex-col items-center p-2">
            <Home className={cn(
              "h-5 w-5 transition-colors",
              isActive('/dashboard') ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>
          
          <Link to="/chat/new" className="flex flex-col items-center p-2">
            <MessageSquare className={cn(
              "h-5 w-5 transition-colors",
              isActive('/chat') ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="text-xs mt-1 font-medium">Chat</span>
          </Link>
          
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <Link to="/admin" className="flex flex-col items-center p-2">
              <Shield className={cn(
                "h-5 w-5 transition-colors",
                isActive('/admin') ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-xs mt-1 font-medium">Admin</span>
            </Link>
          )}
          
          <Link to="/settings" className="flex flex-col items-center p-2">
            <Settings className={cn(
              "h-5 w-5 transition-colors",
              isActive('/settings') ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="text-xs mt-1 font-medium">Settings</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out",
      !isSidebarOpen && "w-[80px]"
    )}>
      <div className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-1 items-center gap-2">
          <span className="flex items-center gap-2 font-semibold tracking-tight">
            <Key className="h-5 w-5 text-primary shrink-0" />
            {isSidebarOpen && (
              <span className="animate-fade-in">LicenseAI</span>
            )}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-accent hover:text-accent-foreground"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto py-6 px-4">
        <nav className="space-y-2">
          <NavItem
            to="/dashboard"
            icon={<Home />}
            label="Dashboard"
            isActive={isActive('/dashboard')}
            isSidebarOpen={isSidebarOpen}
          />
          <NavItem
            to="/chat/new"
            icon={<MessageSquare />}
            label="Chat"
            isActive={isActive('/chat')}
            isSidebarOpen={isSidebarOpen}
          />
          {!user?.licenseActive && (
            <NavItem
              to="/activate"
              icon={<Key />}
              label="Activate License"
              isActive={isActive('/activate')}
              isSidebarOpen={isSidebarOpen}
            />
          )}
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <NavItem
              to="/admin"
              icon={<Shield />}
              label="Admin Panel"
              isActive={isActive('/admin')}
              isSidebarOpen={isSidebarOpen}
            />
          )}
        </nav>
        
        <Separator className="my-6" />
        
        <nav className="space-y-2">
          <NavItem
            to="/settings"
            icon={<Settings />}
            label="Settings"
            isActive={isActive('/settings')}
            isSidebarOpen={isSidebarOpen}
          />
          <div onClick={handleLogout}>
            <NavItem
              to="#"
              icon={<LogOut />}
              label="Logout"
              isActive={false}
              isSidebarOpen={isSidebarOpen}
            />
          </div>
        </nav>
      </div>
      
      <div className="sticky bottom-0 z-20 border-t bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 transition-transform hover:scale-105">
            <AvatarImage src={user?.profileImageUrl} alt={user?.username} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {isSidebarOpen && (
            <div className="flex-1 truncate animate-fade-in">
              <div className="text-sm font-medium leading-none">{user?.username || 'User'}</div>
              <div className="truncate text-xs text-muted-foreground mt-1">{user?.email || 'user@example.com'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
