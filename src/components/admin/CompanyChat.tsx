
import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, RefreshCw } from 'lucide-react';
import { createCompanyChat, getCompanyChatMessages } from '@/utils/companyApi';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { database } from '@/utils/firebase';
import { ref, onValue, off } from 'firebase/database';

interface CompanyChatProps {
  companyId: string;
  companyName: string;
}

interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export const CompanyChat = ({ companyId, companyName }: CompanyChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  
  // Get initial messages and set up real-time listener
  useEffect(() => {
    setIsLoading(true);
    
    // Get initial messages
    getCompanyChatMessages(companyId)
      .then(initialMessages => {
        setMessages(initialMessages);
        setIsLoading(false);
        setTimeout(scrollToBottom, 100);
      })
      .catch(error => {
        console.error('Error fetching chat messages:', error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive"
        });
      });
    
    // Set up real-time listener for new messages
    const messagesRef = ref(database, `companyChats/${companyId}/messages`);
    
    onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messageList: ChatMessage[] = [];
        snapshot.forEach((childSnapshot) => {
          messageList.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        
        // Sort messages by timestamp
        messageList.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        setMessages(messageList);
        setTimeout(scrollToBottom, 100);
      } else {
        setMessages([]);
      }
    });
    
    // Cleanup function
    return () => {
      off(messagesRef);
    };
  }, [companyId]);
  
  const scrollToBottom = () => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    setIsSending(true);
    try {
      await createCompanyChat(
        companyId,
        newMessage,
        user.id,
        user.username || user.email
      );
      
      setNewMessage('');
      // No need to update messages list as the real-time listener will do that
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };
  
  const formatMessageDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };
  
  // Group messages by date
  const groupedMessages: { [date: string]: ChatMessage[] } = {};
  messages.forEach(message => {
    const date = formatMessageDate(message.timestamp);
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });
  
  return (
    <div className="flex flex-col h-[500px] border rounded-md">
      {/* Chat Header */}
      <div className="p-3 border-b flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="font-medium">{companyName} Chat</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={() => getCompanyChatMessages(companyId)}
        >
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>
      
      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" 
        ref={chatAreaRef}
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No messages yet. Send the first message!
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedMessages).map(date => (
              <div key={date} className="space-y-3">
                <div className="flex items-center justify-center">
                  <div className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">
                    {date}
                  </div>
                </div>
                
                {groupedMessages[date].map((message, index) => (
                  <div 
                    key={message.id || index}
                    className={`flex gap-2 ${message.senderId === user?.id ? 'justify-end' : ''}`}
                  >
                    {message.senderId !== user?.id && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-indigo-100 text-indigo-600">
                          {message.senderName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[75%] ${message.senderId === user?.id ? 'order-first' : 'order-last'}`}>
                      {message.senderId !== user?.id && (
                        <div className="text-xs text-muted-foreground mb-1">
                          {message.senderName}
                        </div>
                      )}
                      
                      <div className="flex items-end gap-2">
                        {message.senderId === user?.id && (
                          <div className="text-xs text-muted-foreground self-end">
                            {formatMessageTime(message.timestamp)}
                          </div>
                        )}
                        
                        <div 
                          className={`p-3 rounded-lg ${
                            message.senderId === user?.id 
                              ? 'bg-indigo-500 text-white rounded-tr-none' 
                              : 'bg-white border rounded-tl-none'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                        </div>
                        
                        {message.senderId !== user?.id && (
                          <div className="text-xs text-muted-foreground self-end">
                            {formatMessageTime(message.timestamp)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="p-3 border-t bg-white">
        <form 
          className="flex items-center gap-2" 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-50 border-slate-200"
            disabled={isSending}
          />
          <Button 
            type="submit"
            size="sm"
            disabled={!newMessage.trim() || isSending}
            className="h-10"
          >
            {isSending ? (
              <div className="h-4 w-4 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
