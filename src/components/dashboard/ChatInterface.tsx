import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Chat, ChatMessage } from '@/utils/types';
import { getChatById, createChat, sendMessage, addMessageToChat } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserCircle, Bot, Send, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// OpenAI API key - this should ideally be stored securely server-side
const OPENAI_API_KEY = "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";

export const ChatInterface = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
  }, [chatId, user, navigate]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  // Generate AI response
  const generateAIResponse = async (userMessageContent: string) => {
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
      
      // Call OpenAI API to generate a response
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: userMessageContent }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        console.error('OpenAI API error:', await response.text());
        throw new Error(`OpenAI API returned ${response.status}`);
      }
      
      const data = await response.json();
      const aiMessage = data.choices[0].message.content;
      
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
      await generateAIResponse(messageContent);
      
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
