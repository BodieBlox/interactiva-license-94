
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, User, Building2, Key, ShieldCheck, Users } from 'lucide-react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardStats } from './DashboardStats';
import { UserProfile } from './UserProfile';
import { getChatsByUser } from '@/utils/api';
import { Chat } from '@/utils/types';

export const DashboardContent = () => {
  const { user, logout } = useAuth();
  const { userCompany } = useCompany();
  const navigate = useNavigate();
  const [newChatDisabled, setNewChatDisabled] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  // Fetch chats for the user
  useEffect(() => {
    const fetchChats = async () => {
      if (user?.id) {
        setIsLoadingChats(true);
        try {
          const userChats = await getChatsByUser(user.id);
          setChats(userChats || []);
        } catch (error) {
          console.error('Error fetching chats:', error);
        } finally {
          setIsLoadingChats(false);
        }
      }
    };

    fetchChats();
  }, [user?.id]);

  useEffect(() => {
    const checkNewChatStatus = async () => {
      try {
        const response = await fetch('https://orgid-f590b-default-rtdb.firebaseio.com/systemSettings.json');
        if (response.ok) {
          const data = await response.json();
          setNewChatDisabled(data?.newChatDisabled || false);
        }
      } catch (error) {
        console.error('Error checking new chat status:', error);
      }
    };

    checkNewChatStatus();
  }, []);

  return (
    <div className="container max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      <DashboardHeader 
        user={user} 
        companyName={userCompany?.name || null} 
        onLogout={logout} 
      />

      {/* User Profile Card */}
      <UserProfile user={user} />

      {/* Conversation Stats */}
      <DashboardStats chats={chats} />

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.username || 'User'}! Here's an overview of your account.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-panel border-0">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="rounded-md bg-blue-100 p-3 text-blue-500">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Profile</h2>
              <p className="text-sm text-muted-foreground">
                View and edit your profile information
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="rounded-md bg-green-100 p-3 text-green-500">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Company</h2>
              <p className="text-sm text-muted-foreground">
                Manage your company details and team members
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="rounded-md bg-purple-100 p-3 text-purple-500">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">License</h2>
              <p className="text-sm text-muted-foreground">
                View your license details and activation status
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="rounded-md bg-orange-100 p-3 text-orange-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Security</h2>
              <p className="text-sm text-muted-foreground">
                Manage your account security settings
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="rounded-md bg-red-100 p-3 text-red-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Team</h2>
              <p className="text-sm text-muted-foreground">
                Invite and manage your team members
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        variant="default"
        onClick={() => navigate('/chat/new')}
        disabled={newChatDisabled && user?.role !== 'admin'}
        className="w-full mb-6 bg-primary hover:bg-primary/90 text-white dark:text-primary-foreground shadow-md"
      >
        <MessageSquare className="mr-2 h-5 w-5" />
        <span>New Chat</span>
      </Button>

      {newChatDisabled && user?.role !== 'admin' && (
        <div className="text-center text-sm text-muted-foreground mb-6">
          <p>New chats are currently disabled by the administrator.</p>
        </div>
      )}
    </div>
  );
};
