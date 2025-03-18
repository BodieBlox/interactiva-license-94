
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from './UserManagement';
import { LicenseGenerator } from './LicenseGenerator';
import { ChatViewer } from './ChatViewer';
import { ArrowLeft, LogOut } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const AdminPanel = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-medium">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">Manage users, licenses and view chats</p>
          </div>
        </div>
        <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
          <TabsTrigger value="chats">Chat Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="animate-fade-in">
          <UserManagement />
        </TabsContent>
        <TabsContent value="licenses" className="animate-fade-in">
          <LicenseGenerator />
        </TabsContent>
        <TabsContent value="chats" className="animate-fade-in">
          <ChatViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};
