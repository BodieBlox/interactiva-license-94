import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Chat } from '@/utils/types';
import { getUserChats } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { ChatList } from './ChatList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquarePlus, Shield, LogOut, Settings, ArrowDownAZ, ArrowUpAZ, CalendarClock, MessagesSquare } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'messages';

export const DashboardContent = () => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [sortedChats, setSortedChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const navigate = useNavigate();

  const customStyle = user?.customization?.approved ? {
    '--primary': user.customization.primaryColor || '#7E69AB',
  } as React.CSSProperties : {};

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

  useEffect(() => {
    if (!chats.length) {
      setSortedChats([]);
      return;
    }

    const sorted = [...chats];
    
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        break;
      case 'alphabetical':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'messages':
        sorted.sort((a, b) => {
          const aMessages = Array.isArray(a.messages) ? a.messages.length : 0;
          const bMessages = Array.isArray(b.messages) ? b.messages.length : 0;
          return bMessages - aMessages;
        });
        break;
    }
    
    setSortedChats(sorted);
  }, [chats, sortBy]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8" style={customStyle}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-medium">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {user?.customization?.approved && user.customization.companyName ? 
              `Welcome to ${user.customization.companyName}` : 
              `Welcome back, ${user?.username || 'User'}`}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link to="/settings">
            <Button className="bg-white dark:bg-gray-800 text-primary hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border shadow-sm">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Button>
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin">
              <Button className="bg-amber-500 hover:bg-amber-600 transition-apple flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Admin Panel</span>
              </Button>
            </Link>
          )}
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      <Link to="/chat/new" className="block mb-6">
        <Button className="w-full bg-black hover:bg-black/90 text-white dark:text-white transition-apple py-6 text-lg flex items-center gap-3 shadow-lg border border-primary/30 font-medium">
          <MessageSquarePlus className="h-5 w-5" />
          <span>Create New Conversation</span>
        </Button>
      </Link>

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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Your Conversations</CardTitle>
              <CardDescription>Continue an existing conversation or start a new one</CardDescription>
            </div>
            <div className="flex items-center">
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    <span>Newest First</span>
                  </SelectItem>
                  <SelectItem value="oldest" className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    <span>Oldest First</span>
                  </SelectItem>
                  <SelectItem value="alphabetical" className="flex items-center gap-2">
                    <ArrowDownAZ className="h-4 w-4" />
                    <span>Alphabetical</span>
                  </SelectItem>
                  <SelectItem value="messages" className="flex items-center gap-2">
                    <MessagesSquare className="h-4 w-4" />
                    <span>Most Messages</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              </div>
            ) : (
              <ChatList chats={sortedChats} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
