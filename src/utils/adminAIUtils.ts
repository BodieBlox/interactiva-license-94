
import { database, auth } from './firebase';
import { ref, get, update } from 'firebase/database';
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
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      console.error(`User ${userId} not found`);
      return false;
    }
    
    const user = snapshot.val() as User;
    const defaultWarningMessage = 'Your account has been actioned by an administrator.';
    
    switch (intent.toLowerCase()) {
      case 'suspend':
        // Suspend user with a proper warning message
        await updateUserStatus(userId, 'suspended', data?.message || defaultWarningMessage);
        // Force logout immediately
        await forceUserLogout(userId);
        console.log(`User ${userId} has been suspended and forced to logout`);
        return true;
        
      case 'activate':
        // Activate user
        await updateUserStatus(userId, 'active');
        console.log(`User ${userId} has been activated`);
        return true;
        
      case 'warn':
        // Warn user with a proper warning message
        await updateUserStatus(userId, 'warned', data?.message || defaultWarningMessage);
        // Force logout immediately
        await forceUserLogout(userId);
        console.log(`User ${userId} has been warned and forced to logout`);
        return true;
        
      case 'revoke':
        // Revoke license
        await updateUser(userId, { licenseActive: false });
        console.log(`License for user ${userId} has been revoked`);
        return true;
        
      case 'grant':
        // Grant license
        await updateUser(userId, { 
          licenseActive: true,
          licenseType: data?.type || 'basic'
        });
        console.log(`License for user ${userId} has been granted (${data?.type || 'basic'})`);
        return true;
        
      default:
        console.error(`Unknown admin action: ${intent}`);
        return false;
    }
  } catch (error) {
    console.error('Error executing admin action:', error);
    return false;
  }
};
