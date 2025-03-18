
import { useState, useEffect } from 'react';
import { Chat, User, ChatMessage } from '@/utils/types';
import { getUsers, getUserChats, getChatById, getAllChats } from '@/utils/api';
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
  const [isLoadingChats, setIsLoadingChats] = useState(false);

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

  const handleUserSelect = async (userId: string) => {
    setSelectedUserId(userId);
    setSelectedChat(null);
    setIsLoadingChats(true);
    
    try {
      // Fetch real chats for the selected user
      const chats = await getUserChats(userId);
      setUserChats(chats);
    } catch (error) {
      console.error('Error fetching user chats:', error);
      toast({
        title: "Error",
        description: "Failed to load user conversations",
        variant: "destructive"
      });
      setUserChats([]);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const handleChatSelect = async (chat: Chat) => {
    try {
      // Get the full chat with all messages
      const fullChat = await getChatById(chat.id);
      if (fullChat) {
        setSelectedChat(fullChat);
      } else {
        toast({
          title: "Error",
          description: "Chat not found",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
      toast({
        title: "Error",
        description: "Failed to load chat details",
        variant: "destructive"
      });
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
            {isLoadingChats ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 rounded-full border-3 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              </div>
            ) : userChats.length === 0 ? (
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
                            {chat.messages && chat.messages.length ? 
                              `${chat.messages.length} message${chat.messages.length !== 1 ? 's' : ''}` : 
                              '0 messages'}
                          </p>
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
                    {selectedChat.messages && selectedChat.messages.length > 0 ? (
                      selectedChat.messages.map((message: ChatMessage) => (
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
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground pt-8">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>No messages in this conversation</p>
                      </div>
                    )}
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
