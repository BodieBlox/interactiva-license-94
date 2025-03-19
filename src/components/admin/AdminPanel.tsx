
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from './UserManagement';
import { LicenseGenerator } from './LicenseGenerator';
import { ChatViewer } from './ChatViewer';
import { ArrowLeft, LogOut, Users, Key, MessageSquare, Shield } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';

export const AdminPanel = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
      variant: "success",
    });
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <Card variant="glass" className="mb-8 overflow-hidden">
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="transition-all duration-300 hover:bg-secondary/80 animate-scale-in">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="animate-slide-in-right">
              <h1 className="text-3xl font-medium flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary animate-pulse-subtle" />
                Admin Panel
              </h1>
              <p className="text-muted-foreground mt-1">Manage users, licenses and view chats</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout} 
            className="flex items-center gap-2 transition-all duration-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200 animate-scale-in"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
        <TabsList className="grid grid-cols-3 mb-8 p-1 bg-muted/50 backdrop-blur-sm rounded-lg overflow-hidden">
          <TabsTrigger 
            value="users" 
            className="flex items-center gap-2 data-[state=active]:shadow-md transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
          >
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger 
            value="licenses"
            className="flex items-center gap-2 data-[state=active]:shadow-md transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
          >
            <Key className="h-4 w-4" />
            <span>Licenses</span>
          </TabsTrigger>
          <TabsTrigger 
            value="chats"
            className="flex items-center gap-2 data-[state=active]:shadow-md transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat Logs</span>
          </TabsTrigger>
        </TabsList>
        <div className="transition-all duration-500 ease-apple">
          <TabsContent 
            value="users" 
            className="animate-fade-in focus-visible:outline-none focus-visible:ring-0"
          >
            <UserManagement />
          </TabsContent>
          <TabsContent 
            value="licenses" 
            className="animate-fade-in focus-visible:outline-none focus-visible:ring-0"
          >
            <LicenseGenerator />
          </TabsContent>
          <TabsContent 
            value="chats" 
            className="animate-fade-in focus-visible:outline-none focus-visible:ring-0"
          >
            <ChatViewer />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
