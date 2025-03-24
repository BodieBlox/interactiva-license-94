
import { useState, useEffect, useCallback } from 'react';
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
  Filter,
  Sparkles,
  ArrowUp,
  Clock,
  Star,
  ChevronRight,
  RefreshCw,
  LayoutDashboard
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { DashboardHeader } from './DashboardHeader';
import { DashboardStats } from './DashboardStats';
import { UserProfile } from './UserProfile';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'messages';

export const DashboardContent = () => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [sortedChats, setSortedChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeType, setUpgradeType] = useState<'extension' | 'upgrade'>('extension');
  const [upgradeReason, setUpgradeReason] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [activeTab, setActiveTab] = useState('recent');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const customStyle = user?.customization?.approved ? {
    '--primary': user.customization.primaryColor || '#7E69AB',
  } as React.CSSProperties : {};

  const fetchChats = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching chats for user ID:', user.id);
        const userChats = await getUserChats(user.id);
        console.log('Fetched chats:', userChats);
        
        if (!userChats || !Array.isArray(userChats)) {
          console.log('No chats found or invalid response, setting empty array');
          setChats([]);
        } else {
          setChats(userChats);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        setError(error instanceof Error ? error : new Error('Failed to load your chats'));
        toast({
          title: "Error",
          description: "Failed to load your chats",
          variant: "destructive"
        });
        setChats([]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [fetchChats, user]);

  useEffect(() => {
    if (!chats || !chats.length) {
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

  const handleOpenUpgradeDialog = (type: 'extension' | 'upgrade') => {
    setUpgradeType(type);
    setUpgradeDialogOpen(true);
  };

  const handleSubmitUpgradeRequest = async () => {
    if (!upgradeReason.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a reason for your request",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const response = await fetch('https://orgid-f590b-default-rtdb.firebaseio.com/licenseRequests.json', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.id,
          username: user?.username,
          email: user?.email,
          requestType: upgradeType,
          message: upgradeReason,
          status: 'pending',
          createdAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      toast({
        title: "Request submitted",
        description: upgradeType === 'extension' 
          ? "Your license extension request has been submitted for review" 
          : "Your license upgrade request has been submitted for review",
      });

      setUpgradeDialogOpen(false);
      setUpgradeReason('');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit your request. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const companyName = user?.customization?.approved && user.customization.companyName 
    ? user.customization.companyName 
    : null;

  const recentChats = [...sortedChats].slice(0, 5);
  
  const starredChats = sortedChats.length > 2 ? [...sortedChats].slice(0, 3) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background/70 to-muted/20" style={customStyle}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 sm:mb-6">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              hi Dashboard <span className="text-muted-foreground">• Administrator</span>
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              className="bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5"
              size={isMobile ? "sm" : "default"}
              asChild
            >
              <Link to="/chat/new">
                <MessageSquarePlus className="h-4 w-4" />
                <span>New Chat</span>
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5"
              size={isMobile ? "sm" : "default"}
              onClick={() => handleOpenUpgradeDialog('extension')}
            >
              <Clock className="h-4 w-4" />
              <span>Extend License</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 flex items-center gap-1.5"
              size={isMobile ? "sm" : "default"}
              onClick={() => handleOpenUpgradeDialog('upgrade')}
            >
              <Sparkles className="h-4 w-4" />
              <span>Upgrade</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3 space-y-4">
            <UserProfile user={user} />
            
            <Card className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="bg-primary/5 border-b border-primary/10 pb-3">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                <Link to="/chat/new" className="w-full">
                  <Button 
                    className="w-full justify-start text-sm border border-primary/20 bg-transparent hover:bg-primary/10 text-primary hover:text-primary"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" /> 
                    New Conversation
                  </Button>
                </Link>
                
                <Button 
                  className="w-full justify-start text-sm border border-amber-500/20 bg-transparent hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:text-amber-700"
                  variant="outline"
                  onClick={() => handleOpenUpgradeDialog('extension')}
                >
                  <CalendarClock className="mr-2 h-4 w-4" /> 
                  Request License Extension
                </Button>
                
                <Button 
                  className="w-full justify-start text-sm border border-purple-500/20 bg-transparent hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:text-purple-700"
                  variant="outline"
                  onClick={() => handleOpenUpgradeDialog('upgrade')}
                >
                  <ArrowUp className="mr-2 h-4 w-4" /> 
                  Request Tier Upgrade
                </Button>
                
                <Link to="/settings" className="w-full">
                  <Button 
                    className="w-full justify-start text-sm border border-muted/50 bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                    variant="outline"
                  >
                    <Settings className="mr-2 h-4 w-4" /> 
                    Settings
                  </Button>
                </Link>
                
                {(user?.role === 'admin' || user?.role === 'staff') && (
                  <Link to="/admin" className="w-full">
                    <Button 
                      className="w-full justify-start text-sm border border-red-500/20 bg-transparent hover:bg-red-500/10 text-red-600 dark:text-red-400 hover:text-red-700"
                      variant="outline"
                    >
                      <Shield className="mr-2 h-4 w-4" /> 
                      Admin Panel
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
            
            <DashboardStats chats={chats} />
          </div>

          <div className="lg:col-span-9 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-amber-500/80 to-amber-600 border-none text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300">
                <CardContent className="p-5 flex flex-col items-center text-center">
                  <Clock className="h-12 w-12 mb-3 animate-pulse-soft" />
                  <CardTitle className="mb-2">Extend License</CardTitle>
                  <p className="text-white/80 mb-3">Request additional time for your license</p>
                  <Button 
                    className="w-full bg-white text-amber-600 hover:bg-white/90"
                    onClick={() => handleOpenUpgradeDialog('extension')}
                  >
                    Request Extension
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-500/80 to-purple-600 border-none text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300">
                <CardContent className="p-5 flex flex-col items-center text-center">
                  <Sparkles className="h-12 w-12 mb-3 animate-pulse-soft" />
                  <CardTitle className="mb-2">Upgrade Plan</CardTitle>
                  <p className="text-white/80 mb-3">Get more features with a higher tier plan</p>
                  <Button 
                    className="w-full bg-white text-purple-600 hover:bg-white/90"
                    onClick={() => handleOpenUpgradeDialog('upgrade')}
                  >
                    Request Upgrade
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <Card className="border border-primary/10 shadow-md">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2">
                  <CardTitle className="flex items-center text-xl">
                    <MessagesSquare className="h-5 w-5 mr-2 text-primary" />
                    Your Conversations
                  </CardTitle>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 border-primary/20 text-primary hover:bg-primary/10 sm:w-auto w-1/2"
                      onClick={fetchChats}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
                    </Button>
                  
                    <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                      <SelectTrigger className="h-8 sm:w-[130px] w-1/2 border-primary/20 bg-white/80 dark:bg-gray-800/80">
                        <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
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
                </div>
                <CardDescription>Continue an existing conversation or start a new one</CardDescription>
              </CardHeader>
                
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                <TabsList className="bg-muted/50 border border-border mx-4 w-[calc(100%-2rem)]">
                  <TabsTrigger value="recent" className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Clock className="h-3.5 w-3.5" /> Recent
                  </TabsTrigger>
                  <TabsTrigger value="starred" className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Star className="h-3.5 w-3.5" /> Favorites
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <MessagesSquare className="h-3.5 w-3.5" /> All
                  </TabsTrigger>
                </TabsList>
              
                <TabsContent value="recent" className="mt-0 px-4">
                  <ChatList
                    chats={recentChats}
                    isLoading={isLoading}
                    error={error}
                    onRetry={fetchChats}
                    onUpdate={fetchChats}
                  />
                  
                  {recentChats.length > 0 && (
                    <div className="mt-4 text-center">
                      <Button 
                        variant="link" 
                        className="text-primary flex items-center mx-auto"
                        onClick={() => setActiveTab('all')}
                      >
                        View all conversations <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="starred" className="mt-0 px-4">
                  {starredChats.length > 0 ? (
                    <ChatList
                      chats={starredChats}
                      isLoading={isLoading}
                      error={error}
                      onRetry={fetchChats}
                      onUpdate={fetchChats}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Star className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                      <h3 className="text-lg font-medium mb-1">No favorite conversations yet</h3>
                      <p className="text-muted-foreground text-sm max-w-md mb-4">
                        You haven't marked any conversations as favorites yet. 
                        Star your important conversations to access them quickly.
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="all" className="mt-0 px-4">
                  <ChatList
                    chats={sortedChats}
                    isLoading={isLoading}
                    error={error}
                    onRetry={fetchChats}
                    onUpdate={fetchChats}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {upgradeType === 'extension' 
                ? 'Request License Extension' 
                : 'Request License Tier Upgrade'}
            </DialogTitle>
            <DialogDescription>
              {upgradeType === 'extension'
                ? 'Submit a request to extend your current license period.'
                : 'Submit a request to upgrade your license to a higher tier with more features.'}
            </DialogDescription>
          </DialogHeader>
          
          {upgradeType === 'upgrade' && (
            <RadioGroup defaultValue="premium" className="my-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="premium" id="premium" />
                <Label htmlFor="premium">Premium Tier</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="enterprise" id="enterprise" />
                <Label htmlFor="enterprise">Enterprise Tier</Label>
              </div>
            </RadioGroup>
          )}
          
          <div className="mt-2 space-y-2">
            <Label htmlFor="reason">Reason for request</Label>
            <Textarea 
              id="reason" 
              placeholder="Please explain why you need this change..." 
              value={upgradeReason}
              onChange={(e) => setUpgradeReason(e.target.value)}
              className="h-32"
            />
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitUpgradeRequest}
              disabled={isSubmittingRequest || !upgradeReason.trim()}
              className={upgradeType === 'extension' 
                ? 'bg-amber-500 hover:bg-amber-600' 
                : 'bg-purple-500 hover:bg-purple-600'}
            >
              {isSubmittingRequest ? (
                <div className="h-4 w-4 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
              ) : null}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
