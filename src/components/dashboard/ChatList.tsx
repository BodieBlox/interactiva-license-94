
import { Link } from 'react-router-dom';
import { Chat } from '@/utils/types';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, RefreshCw, ArrowRight, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallback, useState } from 'react';
import { updateChatPin } from '@/utils/chatUtils';
import { toast } from '@/components/ui/use-toast';

interface ChatListProps {
  chats: Chat[];
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  onUpdate?: () => void;
}

export const ChatList = ({ chats, isLoading, error, onRetry, onUpdate }: ChatListProps) => {
  const [isPinning, setIsPinning] = useState<string | null>(null);

  const handleRetry = useCallback(() => {
    if (onRetry) onRetry();
  }, [onRetry]);

  const handlePinToggle = async (e: React.MouseEvent, chat: Chat) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isPinning === chat.id) return;
    
    setIsPinning(chat.id);
    try {
      const newPinState = !chat.isPinned;
      await updateChatPin(chat.id, newPinState);
      
      toast({
        title: newPinState ? "Conversation pinned" : "Conversation unpinned",
        description: newPinState ? "This conversation will stay at the top of your list" : "This conversation has been unpinned",
      });
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error toggling pin status:', error);
      toast({
        title: "Error",
        description: "Failed to update pin status",
        variant: "destructive"
      });
    } finally {
      setIsPinning(null);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="h-8 w-8 rounded-full border-3 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12 animate-fade-in rounded-lg bg-red-50 dark:bg-red-900/20 p-6">
        <MessageSquare className="h-12 w-12 mx-auto text-red-400 opacity-30 mb-4" />
        <h3 className="text-lg font-medium text-red-500 dark:text-red-400">Error loading conversations</h3>
        <p className="text-muted-foreground mt-1 text-sm mb-4 max-w-md mx-auto">
          {error.message.includes("indexOn") 
            ? "Database indexing issue. Please contact your administrator." 
            : error.message}
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRetry}
          className="flex items-center gap-2 border-red-200 dark:border-red-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </Button>
      </div>
    );
  }

  // Show empty state
  if (!chats || chats.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-8 w-8 text-primary opacity-60" />
        </div>
        <h3 className="text-xl font-medium mb-2">No conversations yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Start a new conversation to begin using the AI assistant
        </p>
        <Link to="/chat/new">
          <Button className="bg-primary/90 hover:bg-primary text-white">
            Start Your First Conversation
          </Button>
        </Link>
      </div>
    );
  }

  // Sort chats to show pinned ones first, then by date
  const sortedChats = [...chats].sort((a, b) => {
    // First prioritize pinned status
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // For chats with the same pin status, sort by date
    const dateA = new Date(a.updatedAt || a.createdAt).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt).getTime();
    return dateB - dateA;
  });

  // Show chats list
  return (
    <ul className="space-y-3 animate-fade-in">
      {sortedChats.map((chat, index) => {
        // Ensure messages is an array and get its length
        const messages = Array.isArray(chat.messages) ? chat.messages : [];
        const messageCount = messages.length;
        
        // Format date properly, with fallback
        const chatDate = chat.updatedAt || chat.createdAt;
        let timeAgo = '';
        try {
          timeAgo = formatDistanceToNow(new Date(chatDate), { addSuffix: true });
        } catch (e) {
          console.error(`Invalid date: ${chatDate}`, e);
          timeAgo = 'recently';
        }
        
        return (
          <li key={chat.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-fade-in">
            <Link
              to={`/chat/${chat.id}`}
              className="block rounded-lg hover:bg-primary/5 transition-all duration-300 ease-apple border border-transparent hover:border-primary/20 hover:shadow-sm relative"
            >
              {chat.isPinned && (
                <div className="absolute top-2 right-2 bg-primary/10 rounded-full p-1">
                  <Pin className="h-3 w-3 text-primary" />
                </div>
              )}
              <div className="flex justify-between items-center p-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="bg-primary/10 min-w-10 h-10 rounded-full flex items-center justify-center shadow-inner transition-all duration-300 group-hover:bg-primary/20">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{chat.title || "New Conversation"}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <span className="mr-2">
                        {messageCount} message{messageCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {timeAgo}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 rounded-full hover:bg-primary/10"
                    onClick={(e) => handlePinToggle(e, chat)}
                    disabled={isPinning === chat.id}
                  >
                    {isPinning === chat.id ? (
                      <div className="h-4 w-4 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    ) : chat.isPinned ? (
                      <PinOff className="h-4 w-4 text-primary/70" />
                    ) : (
                      <Pin className="h-4 w-4 text-primary/70" />
                    )}
                  </Button>
                  <ArrowRight className="h-5 w-5 text-primary/40 transition-all duration-300 hover:text-primary" />
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
