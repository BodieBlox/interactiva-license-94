
import { useState, useEffect } from 'react';
import { Chat } from '@/utils/types';
import { MessageSquare, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardStatsProps {
  chats: Chat[];
}

export const DashboardStats = ({ chats }: DashboardStatsProps) => {
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    lastActive: 'Never'
  });

  useEffect(() => {
    if (!chats.length) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayChats = chats.filter(chat => {
      const chatDate = new Date(chat.createdAt);
      chatDate.setHours(0, 0, 0, 0);
      return chatDate.getTime() === today.getTime();
    });
    
    // Find most recent chat
    const sortedChats = [...chats].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    const lastActive = sortedChats.length > 0 
      ? format(new Date(sortedChats[0].updatedAt), 'MMM d, yyyy')
      : 'Never';
    
    setStats({
      total: chats.length,
      today: todayChats.length,
      lastActive
    });
  }, [chats]);

  // If no chats, don't display stats
  if (!chats.length) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 shadow-sm border border-primary/10 flex items-center">
        <div className="bg-primary/20 rounded-full p-2 mr-3">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Conversations</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-teal-500/10 to-teal-500/5 rounded-lg p-4 shadow-sm border border-teal-500/10 flex items-center">
        <div className="bg-teal-500/20 rounded-full p-2 mr-3">
          <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Today's Conversations</p>
          <p className="text-2xl font-semibold">{stats.today}</p>
        </div>
      </div>
      
      <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg p-4 shadow-sm border border-purple-500/10 flex items-center">
        <div className="bg-purple-500/20 rounded-full p-2 mr-3">
          <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Last Activity</p>
          <p className="text-xl font-semibold">{stats.lastActive}</p>
        </div>
      </div>
    </div>
  );
};
