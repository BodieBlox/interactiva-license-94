
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Chat } from '@/utils/types';
import { getUserChats } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { ChatList } from './ChatList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquarePlus, 
  Shield, 
  LogOut, 
  Settings, 
  ArrowDownAZ, 
  ArrowUpAZ, 
  CalendarClock, 
  MessagesSquare, 
  User, 
  Plus, 
  Filter 
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { DashboardHeader } from './DashboardHeader';
import { DashboardStats } from './DashboardStats';
import { UserProfile } from './UserProfile';

type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'messages';

export const DashboardContent = () => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [sortedChats, setSortedChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const customStyle = user?.customization?.approved ? {
    '--primary': user.customization.primaryColor || '#7E69AB',
  } as React.CSSProperties : {};

  const fetchChats = async () => {
    if (user) {
      setIsLoading(true);
      setError(null);
      try {
        const userChats = await getUserChats(user.id);
        setChats(userChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
        setError(error instanceof Error ? error : new Error('Failed to load your chats'));
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

  useEffect(() => {
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

  const companyName = user?.customization?.approved && user.customization.companyName 
    ? user.customization.companyName 
    : null;

  return (
    <div className="bg-gradient-to-br from-background to-muted/50 min-h-screen" style={customStyle}>
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        {/* Header */}
        <DashboardHeader 
          user={user} 
          companyName={companyName} 
          onLogout={handleLogout}
        />

        {/* Mobile User Profile */}
        {isMobile && <UserProfile user={user} />}
        
        {/* Stats Overview */}
        <DashboardStats chats={chats} />

        {/* Main Content */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar - desktop only */}
          {!isMobile && (
            <div className="md:col-span-3">
              <UserProfile user={user} />
              
              <Card className="mt-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-primary/10 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader className="bg-primary/5 border-b border-primary/10 pb-3">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <Link to="/chat/new" className="w-full">
                    <Button 
                      className="w-full justify-start text-sm bg-transparent hover:bg-primary/10 text-primary hover:text-primary border border-primary/20"
                      variant="ghost"
                    >
                      <Plus className="mr-2 h-4 w-4" /> 
                      New Conversation
                    </Button>
                  </Link>
                  <Link to="/settings" className="w-full">
                    <Button 
                      className="w-full justify-start text-sm bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                      variant="ghost"
                    >
                      <Settings className="mr-2 h-4 w-4" /> 
                      Settings
                    </Button>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="w-full">
                      <Button 
                        className="w-full justify-start text-sm bg-transparent hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:text-amber-700"
                        variant="ghost"
                      >
                        <Shield className="mr-2 h-4 w-4" /> 
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main content area */}
          <div className="md:col-span-9">
            {/* Create New Conversation Button - mobile only */}
            {isMobile && (
              <Link to="/chat/new" className="block mb-6">
                <Button className="w-full py-6 text-lg flex items-center gap-3 font-medium
                  bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary
                  shadow-lg shadow-primary/20 border-none transition-all duration-300">
                  <MessageSquarePlus className="h-5 w-5" />
                  <span>Create New Conversation</span>
                </Button>
              </Link>
            )}

            {/* Desktop New Chat Button */}
            {!isMobile && (
              <Link to="/chat/new">
                <Button className="mb-6 py-5 px-6 text-base flex items-center gap-3 font-medium
                  bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary
                  shadow-lg shadow-primary/20 border-none transition-all duration-300">
                  <MessageSquarePlus className="h-5 w-5" />
                  <span>Create New Conversation</span>
                </Button>
              </Link>
            )}

            {/* Conversations Card */}
            <Card className="glass-card shadow-xl border-primary/10">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 border-b border-border/40 pb-4">
                <div>
                  <CardTitle className="flex items-center text-xl">
                    <MessagesSquare className="h-5 w-5 mr-2 text-primary" />
                    Your Conversations
                  </CardTitle>
                  <CardDescription>Continue an existing conversation or start a new one</CardDescription>
                </div>
                
                <div className="flex items-center">
                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[200px]'} border border-primary/20 bg-white/80 dark:bg-gray-800/80`}>
                      <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Sort conversations" />
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
              <CardContent className="p-4 md:p-6">
                <ChatList
                  chats={sortedChats}
                  isLoading={isLoading}
                  error={error}
                  onRetry={fetchChats}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
