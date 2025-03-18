
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Chat } from '@/utils/types';
import { getUserChats } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { ChatList } from './ChatList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquarePlus, Shield, LogOut } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const DashboardContent = () => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      if (user) {
        try {
          const userChats = await getUserChats(user.id);
          setChats(userChats);
        } catch (error) {
          console.error('Error fetching chats:', error);
          toast({
            title: "Error",
            description: "Failed to load your chats",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchChats();
  }, [user]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-medium">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.username}</p>
        </div>
        <div className="flex space-x-3">
          {user?.role === 'admin' && (
            <Link to="/admin">
              <Button className="bg-amber-500 hover:bg-amber-600 transition-apple flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Admin Panel</span>
              </Button>
            </Link>
          )}
          <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {user?.role === 'admin' && (
          <Card className="glass-panel shadow-lg border-0 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-amber-800 dark:text-amber-300">Administrator Access</h2>
                <p className="text-amber-700 dark:text-amber-400 text-sm">You have access to the admin panel</p>
              </div>
              <Link to="/admin">
                <Button className="bg-amber-500 hover:bg-amber-600 transition-apple flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Admin Panel</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card className="glass-panel shadow-lg border-0">
          <CardHeader>
            <CardTitle>Your Conversations</CardTitle>
            <CardDescription>Continue an existing conversation or start a new one</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <Link to="/chat/new">
                    <Button className="bg-primary hover:bg-primary/90 transition-apple w-full flex items-center gap-2">
                      <MessageSquarePlus className="h-5 w-5" />
                      <span>New Conversation</span>
                    </Button>
                  </Link>
                </div>
                <ChatList chats={chats} />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

