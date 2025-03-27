
import { database } from './firebase';
import { ref, get, push, set, update, query, orderByChild, equalTo } from 'firebase/database';
import { User } from './types';

export type NotificationType = 'system' | 'account' | 'company' | 'content';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: string;
  link?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  email: boolean;
  browser: boolean;
  categories: {
    system: boolean;
    account: boolean;
    company: boolean;
    content: boolean;
  };
}

// Fetch notifications for a user
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const notificationsRef = ref(database, 'notifications');
    const notificationsQuery = query(notificationsRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(notificationsQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const notifications: Notification[] = [];
    snapshot.forEach((childSnapshot) => {
      notifications.push({
        id: childSnapshot.key as string,
        ...childSnapshot.val() as Omit<Notification, 'id'>
      });
    });
    
    // Sort by timestamp, newest first
    return notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Create a new notification
export const createNotification = async (notification: Omit<Notification, 'id'>): Promise<Notification> => {
  try {
    const notificationsRef = ref(database, 'notifications');
    const newNotificationRef = push(notificationsRef);
    
    const newNotification: Notification = {
      id: newNotificationRef.key as string,
      ...notification,
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false
    };
    
    await set(newNotificationRef, newNotification);
    
    // Check user notification preferences and send browser notification if enabled
    const userRef = ref(database, `users/${notification.userId}`);
    const userSnapshot = await get(userRef);
    
    if (userSnapshot.exists()) {
      const user = userSnapshot.val() as User;
      
      if (user.notificationPreferences?.browser && 
          user.notificationPreferences.categories[notification.type]) {
        
        // Send browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
      }
    }
    
    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = ref(database, `notifications/${notificationId}`);
    await update(notificationRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const notifications = await getNotifications(userId);
    
    const updates: Record<string, boolean> = {};
    notifications.forEach(notification => {
      if (!notification.read) {
        updates[`notifications/${notification.id}/read`] = true;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      const dbRef = ref(database);
      await update(dbRef, updates);
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (userId: string, preferences: NotificationPreferences): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, { notificationPreferences: preferences });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

// Create a company notification for all members
export const createCompanyNotification = async (companyId: string, notification: Omit<Notification, 'id' | 'userId'>): Promise<void> => {
  try {
    // Fetch all company members
    const companyRef = ref(database, `companies/${companyId}`);
    const companySnapshot = await get(companyRef);
    
    if (!companySnapshot.exists()) {
      throw new Error('Company not found');
    }
    
    const company = companySnapshot.val();
    
    if (!company.members || company.members.length === 0) {
      return;
    }
    
    // Create a notification for each member
    const notificationPromises = company.members.map((memberId: string) => 
      createNotification({
        ...notification,
        userId: memberId,
        type: 'company',
        timestamp: new Date().toISOString()
      })
    );
    
    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error creating company notification:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = ref(database, `notifications/${notificationId}`);
    await set(notificationRef, null);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Delete all notifications for a user
export const deleteAllNotifications = async (userId: string): Promise<void> => {
  try {
    const notifications = await getNotifications(userId);
    
    const deletePromises = notifications.map(notification => 
      deleteNotification(notification.id)
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};
