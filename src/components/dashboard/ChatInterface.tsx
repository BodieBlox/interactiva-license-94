
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Chat, ChatMessage } from '@/utils/types';
import { getChatById, createChat, sendMessage, addMessageToChat } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserCircle, Bot, Send, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const ChatInterface = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Track if we're already polling for AI responses
  const [isPolling, setIsPolling] = useState(false);
  // Ref to hold polling interval
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchChat = async () => {
      if (!user) return;

      if (chatId === 'new') {
        try {
          const newChat = await createChat(user.id, 'New conversation');
          setChat(newChat);
          navigate(`/chat/${newChat.id}`, { replace: true });
        } catch (error) {
          console.error('Error creating chat:', error);
          toast({
            title: "Error",
            description: "Failed to create a new chat",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      } else if (chatId) {
        try {
          const fetchedChat = await getChatById(chatId);
          if (fetchedChat) {
            setChat(fetchedChat);
          } else {
            toast({
              title: "Not found",
              description: "This conversation doesn't exist",
              variant: "destructive"
            });
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Error fetching chat:', error);
          toast({
            title: "Error",
            description: "Failed to load the conversation",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchChat();
    
    return () => {
      // Cleanup polling interval when component unmounts
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [chatId, user, navigate]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  const startPollingForResponse = async (currentChatId: string, messageCount: number) => {
    if (isPolling) return;
    
    setIsPolling(true);
    
    // Clear any existing interval first
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const updatedChat = await getChatById(currentChatId);
        if (updatedChat && updatedChat.messages && updatedChat.messages.length > messageCount) {
          setChat(updatedChat);
          clearInterval(pollingIntervalRef.current as NodeJS.Timeout);
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Error polling for chat updates:', error);
        // Stop polling on error
        clearInterval(pollingIntervalRef.current as NodeJS.Timeout);
        setIsPolling(false);
      }
    }, 1000);
    
    // Safety timeout to avoid infinite polling
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        setIsPolling(false);
      }
    }, 30000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !chat || isSending) return;
    
    setIsSending(true);
    try {
      // Use the message content from state
      const messageContent = message;
      
      // Clear the input field immediately
      setMessage('');
      
      const currentMessageCount = chat.messages?.length || 0;
      
      // Send the message
      const sentMessage = await sendMessage(chat.id, messageContent);
      
      // Update local state
      setChat((prevChat) => {
        if (!prevChat) return null;
        
        const updatedMessages = prevChat.messages ? [...prevChat.messages, sentMessage] : [sentMessage];
        
        return {
          ...prevChat,
          messages: updatedMessages,
          updatedAt: new Date().toISOString()
        };
      });
      
      // Start polling for AI response with the current message count
      startPollingForResponse(chat.id, currentMessageCount + 1);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send your message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const renderMessageContent = (content: string) => {
    // Simple function to render newlines as <br> tags
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i !== content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  const hasMessages = chat?.messages && chat.messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">{chat?.title}</h1>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium">How can I help you today?</h2>
            <p className="text-muted-foreground max-w-md mt-2">
              Ask me anything! I can help with information, creative content, problem-solving, and more.
            </p>
          </div>
        ) : (
          chat?.messages.map((msg: ChatMessage) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 transition-all duration-300 ease-apple animate-scale-in ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div 
                className={`max-w-[75%] rounded-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {renderMessageContent(msg.content)}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="bg-white/50 dark:bg-black/10 border subtle-ring-focus transition-apple"
            disabled={isSending}
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || isSending}
            className="bg-primary hover:bg-primary/90 transition-apple"
          >
            {isSending ? (
              <div className="h-5 w-5 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            ):(
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
