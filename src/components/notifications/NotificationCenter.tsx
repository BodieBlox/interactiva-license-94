
import React, { useState, useEffect } from 'react';
import { Bell, Check, EyeOff, Settings, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { formatDistanceToNow } from 'date-fns';
import { Notification, NotificationType, markNotificationAsRead, getNotifications, updateNotificationPreferences } from '@/utils/notificationService';

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const { user } = useAuth();
  const { userCompany } = useCompany();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    browser: true,
    categories: {
      system: true,
      account: true,
      company: true,
      content: true
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const intervalId = setInterval(fetchNotifications, 60000); // Refresh every minute
      return () => clearInterval(intervalId);
    }
  }, [user]);
  
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const fetchedNotifications = await getNotifications(user.id);
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(notif => !notif.read).length);
      
      // Also fetch preferences if available
      if (user.notificationPreferences) {
        setNotificationPreferences(user.notificationPreferences);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notif => !notif.read);
      await Promise.all(unreadNotifications.map(notif => markNotificationAsRead(notif.id)));
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
      
      toast({
        title: "Notifications marked as read",
        description: `${unreadNotifications.length} notifications marked as read`,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const handleSavePreferences = async () => {
    if (!user) return;
    
    try {
      await updateNotificationPreferences(user.id, notificationPreferences);
      
      setShowSettings(false);
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been updated",
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive"
      });
    }
  };
  
  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(notif => !notif.read)
    : notifications;
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'system':
        return <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>;
      case 'account':
        return <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>;
      case 'company':
        return <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>;
      case 'content':
        return <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>;
      default:
        return <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
    }
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-4 h-4 flex items-center justify-center text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0 w-80">
        <Card className="border-0 rounded-none">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="font-semibold">Notifications</div>
            <div className="flex gap-1">
              {!showSettings && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(true)}
                  className="h-8 w-8"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              {showSettings && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {!showSettings ? (
            <>
              <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}>
                <div className="border-b px-4">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread">
                      Unread {unreadCount > 0 && `(${unreadCount})`}
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="all" className="m-0">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="p-2">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              "p-3 mb-1 rounded-md transition-colors",
                              notification.read ? "bg-transparent" : "bg-muted/60"
                            )}
                          >
                            <div className="flex justify-between">
                              <div className="flex gap-2">
                                {getNotificationIcon(notification.type)}
                                <div>
                                  <p className={cn("text-sm", notification.read ? "font-normal" : "font-medium")}>{notification.title}</p>
                                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
                
                <TabsContent value="unread" className="m-0">
                  {filteredNotifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Check className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No unread notifications</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="p-2">
                        {filteredNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-3 mb-1 rounded-md bg-muted/60"
                          >
                            <div className="flex justify-between">
                              <div className="flex gap-2">
                                {getNotificationIcon(notification.type)}
                                <div>
                                  <p className="text-sm font-medium">{notification.title}</p>
                                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
              
              {unreadCount > 0 && (
                <div className="p-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="p-4">
              <h3 className="font-medium mb-3">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.email}
                    onCheckedChange={(checked) => 
                      setNotificationPreferences(prev => ({ ...prev, email: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Browser Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive notifications in the browser</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.browser}
                    onCheckedChange={(checked) => 
                      setNotificationPreferences(prev => ({ ...prev, browser: checked }))
                    }
                  />
                </div>
                
                <Separator />
                
                <h4 className="text-sm font-medium">Notification Categories</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon('system')}
                      <p className="text-sm">System Notifications</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.categories.system}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({
                          ...prev,
                          categories: { ...prev.categories, system: checked }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon('account')}
                      <p className="text-sm">Account Notifications</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.categories.account}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({
                          ...prev,
                          categories: { ...prev.categories, account: checked }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon('company')}
                      <p className="text-sm">Company Notifications</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.categories.company}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({
                          ...prev,
                          categories: { ...prev.categories, company: checked }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon('content')}
                      <p className="text-sm">Content Notifications</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.categories.content}
                      onCheckedChange={(checked) => 
                        setNotificationPreferences(prev => ({
                          ...prev,
                          categories: { ...prev.categories, content: checked }
                        }))
                      }
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={handleSavePreferences}
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  );
};
