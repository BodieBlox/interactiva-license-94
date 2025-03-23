
import { database } from './firebase';
import { ref, get, update } from 'firebase/database';
import { User } from './types';

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
    
    switch (intent.toLowerCase()) {
      case 'suspend':
        // Suspend user
        await update(userRef, { status: 'suspended' });
        return true;
        
      case 'activate':
        // Activate user
        await update(userRef, { status: 'active' });
        return true;
        
      case 'warn':
        // Warn user
        await update(userRef, { status: 'warned' });
        return true;
        
      case 'revoke':
        // Revoke license
        await update(userRef, { licenseActive: false });
        return true;
        
      case 'grant':
        // Grant license
        await update(userRef, { 
          licenseActive: true,
          licenseType: data?.type || 'basic'
        });
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
