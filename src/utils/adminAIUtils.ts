
import { database, auth } from './firebase';
import { ref, get, update, onValue, off } from 'firebase/database';
import { User } from './types';
import { updateUserStatus, updateUser, forceUserLogout } from './api';

// Parse admin commands from chat messages
export const parseAdminIntent = (message: string): { intent: string; userId?: string; data?: any } | null => {
  // More robust parser for admin commands with multiple formats
  
  // Check for direct admin commands in format: /admin <command> <userId> [data]
  const adminCommandPattern = /^\/admin\s+(\w+)(?:\s+(\w+))?(?:\s+(.+))?$/i;
  const directMatch = message.match(adminCommandPattern);
  
  if (directMatch) {
    const [, intent, userId, dataString] = directMatch;
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
  
  // Check for natural language admin requests
  const suspendPattern = /(?:suspend|ban|block)\s+user\s+(?:with\s+(?:id|email|username)\s+)?(?:"([^"]+)"|(\S+@\S+\.\S+|\S+))/i;
  const suspendMatch = message.match(suspendPattern);
  
  if (suspendMatch) {
    const userIdentifier = suspendMatch[1] || suspendMatch[2];
    // Extract reason if provided
    const reasonMatch = message.match(/(?:for|because|reason|due to)\s+(?:"([^"]+)"|([^\.]+))/i);
    const reason = reasonMatch ? (reasonMatch[1] || reasonMatch[2]) : "Suspended by admin via AI";
    
    return { 
      intent: "suspend", 
      userId: userIdentifier,
      data: { message: reason }
    };
  }
  
  // Check for warning requests
  const warnPattern = /(?:warn|warning|issue\s+warning\s+to)\s+user\s+(?:with\s+(?:id|email|username)\s+)?(?:"([^"]+)"|(\S+@\S+\.\S+|\S+))/i;
  const warnMatch = message.match(warnPattern);
  
  if (warnMatch) {
    const userIdentifier = warnMatch[1] || warnMatch[2];
    // Extract reason if provided
    const reasonMatch = message.match(/(?:for|because|reason|due to)\s+(?:"([^"]+)"|([^\.]+))/i);
    const reason = reasonMatch ? (reasonMatch[1] || reasonMatch[2]) : "Warned by admin via AI";
    
    return { 
      intent: "warn", 
      userId: userIdentifier,
      data: { message: reason }
    };
  }
  
  // Check for activation requests
  const activatePattern = /(?:activate|enable|unsuspend|restore)\s+user\s+(?:with\s+(?:id|email|username)\s+)?(?:"([^"]+)"|(\S+@\S+\.\S+|\S+))/i;
  const activateMatch = message.match(activatePattern);
  
  if (activateMatch) {
    const userIdentifier = activateMatch[1] || activateMatch[2];
    return { intent: "activate", userId: userIdentifier };
  }
  
  // Check for license revocation
  const revokePattern = /(?:revoke|cancel|remove)\s+license\s+(?:for|from)\s+user\s+(?:with\s+(?:id|email|username)\s+)?(?:"([^"]+)"|(\S+@\S+\.\S+|\S+))/i;
  const revokeMatch = message.match(revokePattern);
  
  if (revokeMatch) {
    const userIdentifier = revokeMatch[1] || revokeMatch[2];
    return { intent: "revoke", userId: userIdentifier };
  }
  
  // Check for license granting
  const grantPattern = /(?:grant|give|assign|issue)\s+(?:a\s+)?license\s+(?:to|for)\s+user\s+(?:with\s+(?:id|email|username)\s+)?(?:"([^"]+)"|(\S+@\S+\.\S+|\S+))/i;
  const grantMatch = message.match(grantPattern);
  
  if (grantMatch) {
    const userIdentifier = grantMatch[1] || grantMatch[2];
    // Try to extract license type
    const typeMatch = message.match(/(?:type|tier|level)\s+(?:"([^"]+)"|(\w+))/i);
    const licenseType = typeMatch ? (typeMatch[1] || typeMatch[2]) : "basic";
    
    return { 
      intent: "grant", 
      userId: userIdentifier,
      data: { type: licenseType }
    };
  }
  
  return null;
};

// Helper function to find a user by ID, email, or username
const findUserByIdentifier = async (identifier: string): Promise<User | null> => {
  try {
    // First, check if it's a valid user ID
    const userRef = ref(database, `users/${identifier}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return { id: identifier, ...snapshot.val() } as User;
    }
    
    // If not, check all users to match by email or username
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      
      for (const userId in users) {
        const user = users[userId];
        if (
          (user.email && user.email.toLowerCase() === identifier.toLowerCase()) ||
          (user.username && user.username.toLowerCase() === identifier.toLowerCase())
        ) {
          return { id: userId, ...user } as User;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding user by identifier:', error);
    return null;
  }
};

// Execute admin actions based on the parsed intent
export const executeAdminAction = async (
  intent: string,
  userIdentifier: string, 
  data?: any
): Promise<boolean> => {
  if (!userIdentifier) {
    console.error('No user identifier provided for admin action');
    return false;
  }
  
  try {
    console.log(`Executing admin action: ${intent} for user identifier: ${userIdentifier}`);
    
    // Find user by ID, email, or username
    const user = await findUserByIdentifier(userIdentifier);
    
    if (!user) {
      console.error(`User with identifier ${userIdentifier} not found`);
      return false;
    }
    
    console.log(`Found user for admin action:`, user);
    const userId = user.id;
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
