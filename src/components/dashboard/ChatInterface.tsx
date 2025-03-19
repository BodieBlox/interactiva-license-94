import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Chat, ChatMessage } from '@/utils/types';
import { getChatById, createChat, sendMessage, addMessageToChat } from '@/utils/api';
import { generateAIResponse } from '@/utils/openai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserCircle, Bot, Send, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

export const ChatInterface = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const isNew = chatId === 'new';

  useEffect(() => {
    const initializeChat = async () => {
      if (!user) {
        setError("User not authenticated");
        return;
      }

      setIsLoading(true);
      try {
        if (isNew) {
          const newChat = await createChat(user.id, 'New conversation');
          if (newChat && newChat.id) {
            setChat(newChat);
            navigate(`/chat/${newChat.id}`, { replace: true });
          } else {
            throw new Error('Failed to create chat - no chat ID returned');
          }
        } 
        else if (chatId) {
          const fetchedChat = await getChatById(chatId);
          if (fetchedChat) {
            setChat(fetchedChat);
          } else {
            setError("Conversation not found");
            toast({
              title: "Not found",
              description: "This conversation doesn't exist",
              variant: "destructive"
            });
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError("Failed to initialize conversation");
        toast({
          title: "Error",
          description: "Failed to initialize conversation",
          variant: "destructive"
        });
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [user, chatId, isNew, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  const handleAIResponse = async (userMessageContent: string, currentChat: Chat) => {
    try {
      const loadingMessageId = `loading_${Date.now()}`;
      setChat((prevChat) => {
        if (!prevChat) return null;
        
        const updatedMessages = [
          ...(prevChat.messages || []),
          {
            id: loadingMessageId,
            content: "Thinking...",
            role: 'assistant',
            timestamp: new Date().toISOString(),
            isLoading: true
          } as any
        ];
        
        return {
          ...prevChat,
          messages: updatedMessages
        };
      });
      
      const aiMessage = await generateAIResponse(userMessageContent);
      
      const aiResponseMessage = await addMessageToChat(currentChat.id, {
        content: aiMessage,
        role: 'assistant'
      });
      
      setChat((prevChat) => {
        if (!prevChat) return null;
        
        const updatedMessages = prevChat.messages ? 
          prevChat.messages.filter(msg => msg.id !== loadingMessageId) : [];
        
        if (aiResponseMessage) {
          updatedMessages.push(aiResponseMessage);
        }
        
        return {
          ...prevChat,
          messages: updatedMessages,
          updatedAt: new Date().toISOString()
        };
      });
      
      const updatedChat = await getChatById(currentChat.id);
      if (updatedChat) {
        setChat(updatedChat);
      }
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      setChat((prevChat) => {
        if (!prevChat) return null;
        
        return {
          ...prevChat,
          messages: prevChat.messages ? prevChat.messages.filter(msg => !('isLoading' in msg)) : []
        };
      });
      
      if (currentChat && currentChat.id) {
        await addMessageToChat(currentChat.id, {
          content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
          role: 'assistant'
        });
        
        const updatedChat = await getChatById(currentChat.id);
        if (updatedChat) {
          setChat(updatedChat);
        }
      }
      
      toast({
        title: "Error",
        description: "Failed to generate AI response",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    try {
      const messageContent = message.trim();
      
      setMessage('');
      
      let targetChat = chat;
      
      if (!targetChat) {
        const newChat = await createChat(user!.id, 'New conversation');
        if (!newChat || !newChat.id) {
          throw new Error("Failed to create chat");
        }
        targetChat = newChat;
        setChat(newChat);
        navigate(`/chat/${newChat.id}`, { replace: true });
      }
      
      const sentMessage = await sendMessage(targetChat.id, messageContent);
      
      setChat(prevChat => {
        if (!prevChat) return targetChat;
        
        const updatedMessages = [...(prevChat.messages || []), sentMessage];
        
        return {
          ...prevChat,
          messages: updatedMessages,
          updatedAt: new Date().toISOString()
        };
      });
      
      await handleAIResponse(messageContent, targetChat);
      
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
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i !== content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)]">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin mb-4"></div>
        <p className="text-muted-foreground">
          {isNew ? "Creating new conversation..." : "Loading conversation..."}
        </p>
        {isNew && (
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)]">
        <div className="text-destructive mb-4">⚠️ Error</div>
        <p className="text-muted-foreground">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const hasMessages = chat?.messages && chat.messages.length > 0;

  return (
    <div className={`flex flex-col h-[calc(100vh-${isMobile ? '3.5rem' : '4rem'})]`}>
      <div className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium truncate">{chat?.title || "New conversation"}</h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-950">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium">How can I help you today?</h2>
            <p className="text-muted-foreground max-w-md mt-2">
              Ask me anything! I can help with information, creative content, problem-solving, and more.
            </p>
          </div>
        ) : (
          chat?.messages?.map((msg: ChatMessage) => (
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
                className={`max-w-[80%] md:max-w-[75%] rounded-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                } ${(msg as any).isLoading ? 'opacity-70' : ''} shadow-sm`}
              >
                {(msg as any).isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full border-2 border-t-current border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    <span>Thinking...</span>
                  </div>
                ) : (
                  renderMessageContent(msg.content)
                )}
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
      
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white/80 backdrop-blur-sm dark:bg-black/20">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="bg-white/50 dark:bg-black/10 border subtle-ring-focus transition-apple shadow-sm"
            disabled={isSending}
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || isSending}
            className="bg-primary hover:bg-primary/90 transition-apple shadow-sm"
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
