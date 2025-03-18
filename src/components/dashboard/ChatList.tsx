
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
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
        <h3 className="text-lg font-medium">No conversations yet</h3>
        <p className="text-muted-foreground mt-1">Start a new conversation to begin using the AI</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {chats.map((chat) => {
        // Ensure messages is an array and get its length
        const messages = chat.messages || [];
        const messageCount = Array.isArray(messages) ? messages.length : 0;
        
        return (
          <li key={chat.id}>
            <Link
              to={`/chat/${chat.id}`}
              className="block p-4 rounded-lg hover:bg-secondary transition-apple"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
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
