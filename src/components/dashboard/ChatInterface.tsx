
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
  
  // Check if this is a new chat
  const isNew = chatId === 'new';

  // Create a new chat
  const createNewChat = async () => {
    if (!user) {
      setError("User not authenticated");
      return null;
    }
    
    try {
      setIsLoading(true);
      // Create a new chat with the user ID
      const newChat = await createChat(user.id, 'New conversation');
      
      if (newChat && newChat.id) {
        // Navigate to the new chat
        navigate(`/chat/${newChat.id}`, { replace: true });
        return newChat;
      } else {
        throw new Error('Failed to create chat - no chat ID returned');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      setError("Failed to create a new chat");
      toast({
        title: "Error",
        description: "Failed to create a new chat",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch existing chat by ID
  const fetchExistingChat = async (id: string) => {
    if (!user) {
      setError("User not authenticated");
      return;
    }
    
    try {
      setIsLoading(true);
      const fetchedChat = await getChatById(id);
      
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
    } catch (error) {
      console.error('Error fetching chat:', error);
      setError("Failed to load the conversation");
      toast({
        title: "Error",
        description: "Failed to load the conversation",
        variant: "destructive"
      });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    // Handle new chat creation
    if (isNew) {
      // Create a new chat immediately
      createNewChat();
    } 
    // Handle existing chat
    else if (chatId) {
      fetchExistingChat(chatId);
    }
  }, []);

  // Redirect if still on /chat/new after 5 seconds
  useEffect(() => {
    let timeoutId: number;
    
    if (isNew) {
      timeoutId = window.setTimeout(() => {
        // If we're still on the new chat route after 5 seconds, something went wrong
        navigate('/dashboard');
        toast({
          title: "Error",
          description: "Chat creation timed out. Please try again.",
          variant: "destructive"
        });
      }, 5000);
    }
    
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isNew, navigate]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  // Handle AI responses
  const handleAIResponse = async (userMessageContent: string) => {
    if (!chat) return;
    
    try {
      // First, add a placeholder message to show AI is typing
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
      
      // Generate AI response
      const aiMessage = await generateAIResponse(userMessageContent);
      
      // Add AI response to the chat
      const aiResponseMessage = await addMessageToChat(chat.id, {
        content: aiMessage,
        role: 'assistant',
        timestamp: new Date().toISOString()
      });
      
      // Remove the loading message and add the real AI response
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
      
      // Fetch the updated chat to update the UI with correct data from server
      const updatedChat = await getChatById(chat.id);
      if (updatedChat) {
        setChat(updatedChat);
      }
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Remove the loading message first
      setChat((prevChat) => {
        if (!prevChat) return null;
        
        return {
          ...prevChat,
          messages: prevChat.messages ? prevChat.messages.filter(msg => !('isLoading' in msg)) : []
        };
      });
      
      // Add a generic response in case of error
      await addMessageToChat(chat.id, {
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        role: 'assistant',
        timestamp: new Date().toISOString()
      });
      
      // Fetch the updated chat to update the UI
      const updatedChat = await getChatById(chat.id);
      if (updatedChat) {
        setChat(updatedChat);
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
    
    if (!message.trim() || !chat || isSending) return;
    
    setIsSending(true);
    try {
      // Use the message content from state
      const messageContent = message.trim();
      
      // Clear the input field immediately
      setMessage('');
      
      // Send the user message
      await sendMessage(chat.id, messageContent);
      
      // Fetch the updated chat with messages
      const updatedChat = await getChatById(chat.id);
      setChat(updatedChat);
      
      // Generate AI response
      await handleAIResponse(messageContent);
      
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

  // Show loading screen for new chat
  if (isNew) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)]">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin mb-4"></div>
        <p className="text-muted-foreground">Creating new conversation...</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/dashboard')}
        >
          Cancel
        </Button>
      </div>
    );
  }

  // Show loading screen for existing chat
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)]">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin mb-4"></div>
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  // Show error screen
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
                className={`max-w-[75%] rounded-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                } ${(msg as any).isLoading ? 'opacity-70' : ''}`}
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
