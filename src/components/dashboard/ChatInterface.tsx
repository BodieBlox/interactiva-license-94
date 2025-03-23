import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Chat, ChatMessage } from '@/utils/types';
import { getChatById, createChat, sendMessage, addMessageToChat, updateUserStatus } from '@/utils/api';
import { generateAIResponse, fetchDatabaseForAdmin } from '@/utils/openai';
import { generateChatTitle, updateChatPin } from '@/utils/chatUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Bot, Send, ArrowLeft, Database } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { parseAdminIntent, executeAdminAction } from '@/utils/adminAIUtils';
import { checkForInappropriateContent, handleInappropriateMessage } from '@/utils/aiModeration';
import { AIResponseEmbed } from './AIResponseEmbed';

export const ChatInterface = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatabase, setShowDatabase] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const isNew = chatId === 'new';
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const hasAdminAccess = isAdmin || isStaff;

  useEffect(() => {
    const initializeChat = async () => {
      if (!user) {
        console.error("No authenticated user found");
        setError("User not authenticated");
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        if (isNew) {
          console.log("Creating new chat for user:", user.id);
          const newChat = await createChat(user.id, 'New conversation');
          
          if (newChat && newChat.id) {
            console.log("New chat created:", newChat.id);
            setChat(newChat);
            navigate(`/chat/${newChat.id}`, { replace: true });
          } else {
            console.error("Failed to create new chat - no chat ID returned");
            throw new Error('Failed to create chat - no chat ID returned');
          }
        } 
        else if (chatId) {
          console.log("Fetching existing chat:", chatId);
          const fetchedChat = await getChatById(chatId);
          
          if (fetchedChat) {
            console.log("Chat fetched successfully:", fetchedChat.id);
            setChat(fetchedChat);
          } else {
            console.error("Chat not found:", chatId);
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
            role: 'assistant' as const,
            timestamp: new Date().toISOString(),
            isLoading: true
          }
        ];
        
        return {
          ...prevChat,
          messages: updatedMessages
        };
      });
      
      let adminActionResult: string | null = null;
      let isAdminAction = false;
      
      // Process admin commands when user has admin access
      if (hasAdminAccess) {
        console.log("Checking for admin intent in:", userMessageContent);
        const adminAction = parseAdminIntent(userMessageContent);
        
        if (adminAction && adminAction.intent && adminAction.userId) {
          console.log("Detected admin action:", adminAction);
          isAdminAction = true;
          
          // Execute the admin action with the proper arguments
          adminActionResult = await executeAdminAction(
            adminAction.intent, 
            adminAction.userId, 
            adminAction.data
          );
          
          console.log("Admin action result:", adminActionResult);
        }
      }
      
      const conversationHistory = currentChat.messages || [];
      
      // Use admin action result if available, otherwise generate AI response
      const aiMessage = isAdminAction && adminActionResult 
        ? adminActionResult
        : await generateAIResponse(userMessageContent, conversationHistory, hasAdminAccess);
      
      // Add AI response to chat
      const aiResponseMessage = await addMessageToChat(currentChat.id, {
        content: aiMessage,
        role: 'assistant',
        isAdminAction: isAdminAction
      });
      
      // Update chat state
      setChat((prevChat) => {
        if (!prevChat) return null;
        
        const updatedMessages = prevChat.messages ? 
          prevChat.messages.filter(msg => msg.id !== loadingMessageId) : [];
        
        if (aiResponseMessage) {
          updatedMessages.push(aiResponseMessage as ChatMessage);
        }
        
        return {
          ...prevChat,
          messages: updatedMessages,
          updatedAt: new Date().toISOString()
        } as Chat;
      });
      
      // Refresh chat to ensure we have latest data
      const updatedChat = await getChatById(currentChat.id);
      if (updatedChat) {
        setChat(updatedChat);
      }
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Remove loading message
      setChat((prevChat: Chat | null) => {
        if (!prevChat) return null;
        
        return {
          ...prevChat,
          messages: prevChat.messages ? 
            prevChat.messages.filter(msg => !('isLoading' in msg)) : []
        } as Chat;
      });
      
      // Add error message
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
    
    // Check for inappropriate content
    const contentCheck = checkForInappropriateContent(message.trim());
    if (contentCheck.isInappropriate) {
      console.log("Inappropriate content detected:", contentCheck.reason);
      if (user) {
        try {
          const warningResponse = await handleInappropriateMessage(
            user.id, 
            user.username || user.email,
            updateUserStatus
          );
          
          // Add both the user's message and the warning to the chat
          let targetChat = chat;
          
          if (!targetChat) {
            const newChat = await createChat(user.id, 'New conversation');
            if (!newChat || !newChat.id) {
              throw new Error("Failed to create chat");
            }
            targetChat = newChat;
            setChat(newChat);
            navigate(`/chat/${newChat.id}`, { replace: true });
          }
          
          // Add user's message so they can see what they sent
          const sentMessage = await sendMessage(targetChat.id, message.trim(), 'user');
          
          // Add warning message from system
          await addMessageToChat(targetChat.id, {
            content: warningResponse,
            role: 'assistant'
          });
          
          // Update local chat state
          const updatedChat = await getChatById(targetChat.id);
          if (updatedChat) {
            setChat(updatedChat);
          }
          
          toast({
            title: "Warning",
            description: "Your message contains inappropriate language",
            variant: "destructive"
          });
          
          setMessage('');
          return;
        } catch (error) {
          console.error("Error handling inappropriate message:", error);
        }
      }
    }
    
    // Handle regular message if no inappropriate content
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
      
      const sentMessage = await sendMessage(targetChat.id, messageContent, 'user');
      
      setChat(prevChat => {
        if (!prevChat) return targetChat;
        
        const updatedMessages = [...(prevChat.messages || []), sentMessage as ChatMessage];
        
        return {
          ...prevChat,
          messages: updatedMessages,
          updatedAt: new Date().toISOString()
        } as Chat;
      });
      
      if (!targetChat.messages || targetChat.messages.length === 0) {
        try {
          const generatedTitle = await generateChatTitle(messageContent);
          
          await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/chat/${targetChat.id}.json`, {
            method: 'PATCH',
            body: JSON.stringify({ title: generatedTitle }),
          });
          
          setChat(prevChat => {
            if (!prevChat) return null;
            return {
              ...prevChat,
              title: generatedTitle
            } as Chat;
          });
        } catch (titleError) {
          console.error('Error generating chat title:', titleError);
        }
      }
      
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

  const fetchDatabaseInfo = async () => {
    if (!hasAdminAccess) return;
    
    try {
      setShowDatabase(true);
      const dbInfo = await fetchDatabaseForAdmin();
      setDatabaseInfo(dbInfo);
    } catch (error) {
      console.error('Error fetching database info:', error);
      toast({
        title: "Error",
        description: "Failed to fetch database information",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)]">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin mb-4"></div>
        <p className="text-muted-foreground">
          {isNew ? "Creating new conversation..." : "Loading conversation..."}
        </p>
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
      <div className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm dark:bg-black/20">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
            className="mr-2 transition-apple"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium truncate">{chat?.title || "New conversation"}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {hasAdminAccess && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 transition-apple"
                onClick={fetchDatabaseInfo}
              >
                <Database className="h-4 w-4" />
                <span className="hidden md:inline">Database</span>
              </Button>
              <Badge 
                variant="outline" 
                className={`
                  ${isAdmin 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 animate-pulse-soft' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 animate-pulse-soft'
                  }
                `}
              >
                {isAdmin ? 'Admin Mode' : 'Staff Mode'}
              </Badge>
            </>
          )}
        </div>
      </div>
      
      {showDatabase && hasAdminAccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] flex flex-col animate-scale-in">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Database Information</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDatabase(false)}
                className="transition-apple"
              >
                Close
              </Button>
            </div>
            <div className="p-4 overflow-auto flex-grow">
              <pre className="text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-900 p-4 rounded-md">
                {databaseInfo || 'Loading database information...'}
              </pre>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-950">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <Bot className="h-12 w-12 text-muted-foreground mb-4 animate-float" />
            <h2 className="text-xl font-medium">How can I help you today?</h2>
            <p className="text-muted-foreground max-w-md mt-2">
              {hasAdminAccess 
                ? "As an admin, you can ask me to perform admin actions like listing users, suspending accounts, or managing licenses."
                : "Ask me anything! I can help with information, creative content, problem-solving, and more."
              }
            </p>
            
            {hasAdminAccess && (
              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 max-w-md animate-slide-in">
                <h3 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Admin Command Examples:</h3>
                <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1 text-left">
                  <li className="animate-fade-in" style={{animationDelay: "0.1s"}}>• "List all users"</li>
                  <li className="animate-fade-in" style={{animationDelay: "0.2s"}}>• "Show me users with email containing gmail"</li>
                  <li className="animate-fade-in" style={{animationDelay: "0.3s"}}>• "Get details for user johnsmith"</li>
                  <li className="animate-fade-in" style={{animationDelay: "0.4s"}}>• "Suspend user with email user@example.com for violating terms"</li>
                  <li className="animate-fade-in" style={{animationDelay: "0.5s"}}>• "Issue warning to user alex about inappropriate content"</li>
                  <li className="animate-fade-in" style={{animationDelay: "0.6s"}}>• "Revoke license for user david@company.com"</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          chat?.messages?.map((msg: ChatMessage, index) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 transition-all duration-300 ease-apple animate-scale-in ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
              style={{animationDelay: `${index * 0.05}s`}}
            >
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 animate-fade-in">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div 
                className={`max-w-[80%] md:max-w-[75%] rounded-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground hover-lift' 
                    : msg.isAdminAction
                      ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100 hover-lift'
                      : 'bg-secondary text-secondary-foreground hover-lift'
                } ${(msg as any).isLoading ? 'opacity-70' : ''} shadow-sm`}
              >
                {(msg as any).isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full border-2 border-t-current border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    <span>Thinking...</span>
                  </div>
                ) : (
                  msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">
                      {msg.content.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          {i !== msg.content.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <AIResponseEmbed content={msg.content} isAdminAction={msg.isAdminAction} />
                  )
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 animate-fade-in">
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
            placeholder={hasAdminAccess 
              ? "Type admin command or message..." 
              : "Type your message..."
            }
            className="bg-white/50 dark:bg-black/10 border subtle-ring-focus transition-apple shadow-sm animate-slide-in-bottom"
            disabled={isSending}
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || isSending}
            className="bg-primary hover:bg-primary/90 transition-apple shadow-sm animate-slide-in-bottom"
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
