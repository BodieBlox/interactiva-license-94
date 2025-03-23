
import { database, auth } from './firebase';
import { ref, get, update, onValue, off } from 'firebase/database';
import { User } from './types';
import { updateUserStatus, updateUser, forceUserLogout } from './api';

// Parse admin commands from chat messages
export const parseAdminIntent = (message: string): { intent: string; userId?: string; data?: any } | null => {
  // Simple parser for admin commands in the format: /admin <command> <userId> [data]
  const adminCommandPattern = /^\/admin\s+(\w+)(?:\s+(\w+))?(?:\s+(.+))?$/i;
  const match = message.match(adminCommandPattern);
  
  if (match) {
    const [, intent, userId, dataString] = match;
    let data;
    
    // Try to parse data as JSON if it exists
    if (dataString) {
      try {
        data = JSON.parse(dataString);
      } catch (err) {
        // If not valid JSON, use as is
        data = dataString;
      }
    }
    
    return { intent, userId, data };
  }
  
  return null;
};

// Execute admin actions based on the parsed intent
export const executeAdminAction = async (
  intent: string,
  userId: string, 
  data?: any
): Promise<boolean> => {
  if (!userId) {
    console.error('No user ID provided for admin action');
    return false;
  }
  
  try {
    console.log(`Executing admin action: ${intent} for user: ${userId}`);
    
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      console.error(`User ${userId} not found`);
      return false;
    }
    
    const user = snapshot.val() as User;
    const defaultWarningMessage = 'Your account has been actioned by an administrator.';
    
    switch (intent.toLowerCase()) {
      case 'suspend': {
        // Suspend user with a proper warning message
        const message = data?.message || defaultWarningMessage;
        console.log(`Suspending user ${userId} with message: ${message}`);
        
        try {
          // Update user status in the database
          await updateUserStatus(userId, 'suspended', message);
          console.log(`User status updated to suspended`);
          
          // Force logout immediately
          await forceUserLogout(userId);
          console.log(`User ${userId} has been forced to logout`);
          
          return true;
        } catch (error) {
          console.error(`Error suspending user:`, error);
          return false;
        }
      }
        
      case 'activate': {
        console.log(`Activating user ${userId}`);
        
        try {
          // Activate user - clear warning message
          await updateUserStatus(userId, 'active', null);
          console.log(`User ${userId} has been activated successfully`);
          return true;
        } catch (error) {
          console.error(`Error activating user:`, error);
          return false;
        }
      }
        
      case 'warn': {
        // Warn user with a proper warning message
        const message = data?.message || defaultWarningMessage;
        console.log(`Warning user ${userId} with message: ${message}`);
        
        try {
          // Update user status in the database
          await updateUserStatus(userId, 'warned', message);
          console.log(`User status updated to warned`);
          
          // Force logout immediately
          await forceUserLogout(userId);
          console.log(`User ${userId} has been forced to logout`);
          
          return true;
        } catch (error) {
          console.error(`Error warning user:`, error);
          return false;
        }
      }
        
      case 'revoke': {
        console.log(`Revoking license for user ${userId}`);
        
        try {
          // Revoke license
          await updateUser(userId, { licenseActive: false });
          console.log(`License for user ${userId} has been revoked`);
          return true;
        } catch (error) {
          console.error(`Error revoking license:`, error);
          return false;
        }
      }
        
      case 'grant': {
        const licenseType = data?.type || 'basic';
        console.log(`Granting ${licenseType} license to user ${userId}`);
        
        try {
          // Grant license
          await updateUser(userId, { 
            licenseActive: true,
            licenseType: licenseType
          });
          
          console.log(`License for user ${userId} has been granted (${licenseType})`);
          return true;
        } catch (error) {
          console.error(`Error granting license:`, error);
          return false;
        }
      }
        
      default:
        console.error(`Unknown admin action: ${intent}`);
        return false;
    }
  } catch (error) {
    console.error('Error executing admin action:', error);
    return false;
  }
};

// Helper function to listen for status changes
export const listenForUserStatusChanges = (userId: string, callback: (status: User['status'], message?: string) => void): (() => void) => {
  const userRef = ref(database, `users/${userId}/status`);
  const messageRef = ref(database, `users/${userId}/warningMessage`);
  
  const statusListener = onValue(userRef, (snapshot) => {
    const status = snapshot.val() as User['status'] | null;
    if (status) {
      get(messageRef).then((msgSnapshot) => {
        const message = msgSnapshot.val();
        callback(status, message);
      });
    }
  });
  
  return () => {
    off(userRef, 'value', statusListener);
  };
};
