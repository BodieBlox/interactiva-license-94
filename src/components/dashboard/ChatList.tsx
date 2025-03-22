
import { Link } from 'react-router-dom';
import { Chat } from '@/utils/types';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallback } from 'react';

interface ChatListProps {
  chats: Chat[];
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
}

export const ChatList = ({ chats, isLoading, error, onRetry }: ChatListProps) => {
  const handleRetry = useCallback(() => {
    if (onRetry) onRetry();
  }, [onRetry]);

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
  if (chats.length === 0) {
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

  // Show chats list
  return (
    <ul className="space-y-3 animate-fade-in">
      {chats.map((chat, index) => {
        // Ensure messages is an array and get its length
        const messages = Array.isArray(chat.messages) ? chat.messages : [];
        const messageCount = messages.length;
        
        return (
          <li key={chat.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-fade-in">
            <Link
              to={`/chat/${chat.id}`}
              className="block rounded-lg hover:bg-primary/5 transition-all duration-300 ease-apple border border-transparent hover:border-primary/20 hover:shadow-sm"
            >
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
                        {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <ArrowRight className="h-5 w-5 text-primary/40 transition-all duration-300 hover:text-primary" />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
