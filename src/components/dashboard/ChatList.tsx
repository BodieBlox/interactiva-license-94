
import { Link } from 'react-router-dom';
import { Chat } from '@/utils/types';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare } from 'lucide-react';

interface ChatListProps {
  chats: Chat[];
}

export const ChatList = ({ chats }: ChatListProps) => {
  if (chats.length === 0) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
        <h3 className="text-lg font-medium">No conversations yet</h3>
        <p className="text-muted-foreground mt-1">Start a new conversation to begin using the AI</p>
      </div>
    );
  }

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
              className="block p-4 rounded-lg hover:bg-secondary hover:shadow-md transition-all duration-300 ease-apple"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center shadow-inner transition-all duration-300 group-hover:bg-primary/20">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{chat.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {messageCount} message{messageCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
