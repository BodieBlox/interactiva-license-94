
import { useState, useEffect } from 'react';
import { Chat, User } from '@/utils/types';
import { getUsers } from '@/utils/api';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, UserCircle, Bot } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

export const ChatViewer = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await getUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // This would be a real API call in a production app
  const mockFetchUserChats = (userId: string) => {
    // For demo purposes, we're just returning the same mock chat for everyone
    const mockChat: Chat = {
      id: '1',
      title: 'Sample conversation',
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: '1',
          content: 'What can you tell me about neural networks?',
          role: 'user',
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString() // 10 minutes ago
        },
        {
          id: '2',
          content: 'Neural networks are computing systems inspired by the biological neural networks that constitute animal brains. They are a subset of machine learning and are at the heart of deep learning algorithms. Their name and structure are inspired by the human brain, mimicking the way biological neurons signal to one another.',
          role: 'assistant',
          timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString() // 9 minutes ago
        },
        {
          id: '3',
          content: 'Can you explain how they learn?',
          role: 'user',
          timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString() // 8 minutes ago
        },
        {
          id: '4',
          content: 'Neural networks learn through a process called training. During training, the network is fed with labeled examples and uses an algorithm called backpropagation to adjust its internal weights. This adjustment minimizes the difference between the network\'s actual output and the desired output. Over time, with enough training examples, the network learns to recognize patterns in the data and make increasingly accurate predictions or classifications.',
          role: 'assistant',
          timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString() // 7 minutes ago
        }
      ]
    };
    
    return [mockChat];
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedChat(null);
    
    // In a real app, this would be an API call
    const chats = mockFetchUserChats(userId);
    setUserChats(chats);
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
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
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Select value={selectedUserId} onValueChange={handleUserSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a user to view chats" />
          </SelectTrigger>
          <SelectContent>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id}>
                {user.username} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedUserId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium mb-4">Conversations</h3>
            {userChats.length === 0 ? (
              <Card className="glass-panel border-0">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No conversations found
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {userChats.map(chat => (
                  <Card 
                    key={chat.id} 
                    className={`glass-panel border-0 cursor-pointer transition-apple ${
                      selectedChat?.id === chat.id ? 'bg-secondary/50 shadow-lg' : 'hover:bg-secondary/30'
                    }`}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{chat.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium mb-4">Chat Log</h3>
            <Card className="glass-panel border-0 h-[600px] flex flex-col">
              {selectedChat ? (
                <CardContent className="p-6 overflow-y-auto flex-1">
                  <div className="space-y-6">
                    {selectedChat.messages.map(message => (
                      <div key={message.id} className="flex gap-4">
                        <div className="flex-shrink-0">
                          {message.role === 'user' ? (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserCircle className="h-5 w-5 text-primary" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="h-5 w-5 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {message.role === 'user' ? 'User' : 'AI'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="text-sm bg-secondary/50 rounded-lg p-3">
                            {renderMessageContent(message.content)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-6 flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Select a conversation to view chat logs</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
