
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from './UserManagement';
import { LicenseGenerator } from './LicenseGenerator';
import { ChatViewer } from './ChatViewer';
import { ArrowLeft, LogOut, Users, Key, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

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
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="transition-all duration-300 hover:bg-secondary/80">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-medium">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">Manage users, licenses and view chats</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          onClick={handleLogout} 
          className="flex items-center gap-2 transition-all duration-300 hover:bg-red-50 hover:text-red-500"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
        <TabsList className="grid grid-cols-3 mb-8 p-1 bg-muted/50 backdrop-blur-sm">
          <TabsTrigger 
            value="users" 
            className="flex items-center gap-2 data-[state=active]:shadow-md transition-all duration-300"
          >
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger 
            value="licenses"
            className="flex items-center gap-2 data-[state=active]:shadow-md transition-all duration-300"
          >
            <Key className="h-4 w-4" />
            <span>Licenses</span>
          </TabsTrigger>
          <TabsTrigger 
            value="chats"
            className="flex items-center gap-2 data-[state=active]:shadow-md transition-all duration-300"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat Logs</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="animate-fade-in focus-visible:outline-none focus-visible:ring-0">
          <UserManagement />
        </TabsContent>
        <TabsContent value="licenses" className="animate-fade-in focus-visible:outline-none focus-visible:ring-0">
          <LicenseGenerator />
        </TabsContent>
        <TabsContent value="chats" className="animate-fade-in focus-visible:outline-none focus-visible:ring-0">
          <ChatViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};
