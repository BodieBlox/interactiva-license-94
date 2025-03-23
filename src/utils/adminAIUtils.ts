// Import the necessary functions and types
import { getUserByEmail, updateUserStatus, getUsers, updateUser, suspendLicense, revokeLicense } from './api';
import { User, AdminAction } from './types';

// Function to parse admin intent from natural language
export const parseAdminIntent = (message: string) => {
  const lowerMessage = message.toLowerCase();
  
  // Check for user targeting patterns
  const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  const usernameMatch = message.match(/(?:user|username)[:\s]+([A-Za-z0-9_-]+)/i) || 
                         message.match(/([A-Za-z0-9_-]+)(?:'s| user| account)/i);
  
  // Define possible admin actions
  if (lowerMessage.includes('list') && lowerMessage.includes('user')) {
    return {
      intent: 'user_list',
      userId: null,
      data: null
    };
  }
  
  if ((lowerMessage.includes('detail') || lowerMessage.includes('info') || lowerMessage.includes('show me')) && 
      (lowerMessage.includes('user') || emailMatch || usernameMatch)) {
    const targetUser = emailMatch ? emailMatch[0] : 
                     usernameMatch ? usernameMatch[1] : null;
    
    return {
      intent: 'user_details',
      userId: targetUser,
      data: null
    };
  }
  
  if (lowerMessage.includes('suspend') && 
     (lowerMessage.includes('user') || emailMatch || usernameMatch)) {
    const targetUser = emailMatch ? emailMatch[0] : 
                     usernameMatch ? usernameMatch[1] : null;
    
    // Extract reason if provided
    const reasonMatch = message.match(/(?:for|because|reason)[:\s]+(.+?)(?:$|\.)/i);
    const reason = reasonMatch ? reasonMatch[1].trim() : null;
    
    return {
      intent: 'suspend_user',
      userId: targetUser,
      data: reason
    };
  }
  
  if ((lowerMessage.includes('warn') || lowerMessage.includes('warning')) && 
     (lowerMessage.includes('user') || emailMatch || usernameMatch)) {
    const targetUser = emailMatch ? emailMatch[0] : 
                     usernameMatch ? usernameMatch[1] : null;
    
    // Extract reason if provided
    const reasonMatch = message.match(/(?:for|because|reason|about)[:\s]+(.+?)(?:$|\.)/i);
    const reason = reasonMatch ? reasonMatch[1].trim() : null;
    
    return {
      intent: 'warn_user',
      userId: targetUser,
      data: reason
    };
  }
  
  if (lowerMessage.includes('activate') && 
     (lowerMessage.includes('user') || emailMatch || usernameMatch)) {
    const targetUser = emailMatch ? emailMatch[0] : 
                     usernameMatch ? usernameMatch[1] : null;
    
    return {
      intent: 'activate_user',
      userId: targetUser,
      data: null
    };
  }
  
  if ((lowerMessage.includes('revoke') || lowerMessage.includes('remove')) && 
      lowerMessage.includes('license') && 
     (lowerMessage.includes('user') || emailMatch || usernameMatch)) {
    const targetUser = emailMatch ? emailMatch[0] : 
                     usernameMatch ? usernameMatch[1] : null;
    
    return {
      intent: 'revoke_license',
      userId: targetUser,
      data: null
    };
  }
  
  if (lowerMessage.includes('suspend') && 
      lowerMessage.includes('license') && 
     (lowerMessage.includes('user') || emailMatch || usernameMatch)) {
    const targetUser = emailMatch ? emailMatch[0] : 
                     usernameMatch ? usernameMatch[1] : null;
    
    return {
      intent: 'suspend_license',
      userId: targetUser,
      data: null
    };
  }
  
  // No admin intent detected
  return null;
};

// Function to handle user lookup
export const lookupUser = async (searchTerm: string): Promise<User | null> => {
  try {
    // Try to find user by email
    const user = await getUserByEmail(searchTerm);
    if (user) {
      return user;
    }
    
    // If not found by email, try to search in all users by username
    const allUsers = await getUsers();
    const userByUsername = allUsers.find(u => 
      u.username?.toLowerCase() === searchTerm.toLowerCase()
    );
    
    return userByUsername || null;
  } catch (error) {
    console.error("Error looking up user:", error);
    return null;
  }
};

// Function to execute an admin action based on intent and userId
export const executeAdminAction = async (intent: string, userId: string | null, data: any = null): Promise<string> => {
  try {
    if (!userId && intent !== 'user_list') {
      return "User identifier not provided. Please specify a username or email.";
    }
    
    let user: User | null = null;
    
    // Find the target user for actions that require a specific user
    if (userId && intent !== 'user_list') {
      // Try email lookup first
      if (userId.includes('@')) {
        user = await getUserByEmail(userId);
      } else {
        // Try username lookup
        user = await lookupUser(userId);
      }
      
      if (!user) {
        return `User "${userId}" not found. Please provide a valid username or email.`;
      }
    }
    
    // Execute the requested action
    switch (intent) {
      case 'user_list':
        const users = await getUsers();
        return `Found ${users.length} users:\n${users.map(u => `- ${u.username || 'No username'} (${u.email}): ${u.status}, Role: ${u.role}, License: ${u.licenseActive ? 'Active' : 'Inactive'}`).join('\n')}`;
      
      case 'user_details':
        if (!user) return "User not found";
        return `User Details:
Username: ${user.username || 'Not set'}
Email: ${user.email}
Status: ${user.status}
Role: ${user.role}
License: ${user.licenseActive ? 'Active' : 'Inactive'} (${user.licenseType || 'None'})
Account created: ${user.createdAt || 'Unknown date'}
Last login: ${user.lastLogin || 'Never'}`;
        
      case 'suspend_user':
        await updateUserStatus(user!.id, 'suspended', data || 'Account suspended by administrator');
        return `User ${user!.username || user!.email} has been suspended.`;
        
      case 'warn_user':
        await updateUserStatus(user!.id, 'warned', data || 'Account warning issued by administrator');
        return `User ${user!.username || user!.email} has been warned.`;
        
      case 'activate_user':
        await updateUserStatus(user!.id, 'active');
        return `User ${user!.username || user!.email} has been activated.`;
        
      case 'suspend_license':
        if (!user!.licenseKey) {
          return `User ${user!.username || user!.email} does not have an active license.`;
        }
        await suspendLicense(user!.licenseKey);
        return `License for user ${user!.username || user!.email} has been suspended.`;
        
      case 'revoke_license':
        if (!user!.licenseKey) {
          return `User ${user!.username || user!.email} does not have an active license.`;
        }
        await revokeLicense(user!.licenseKey);
        return `License for user ${user!.username || user!.email} has been revoked.`;
        
      default:
        return `Unknown action: ${intent}`;
    }
  } catch (error) {
    console.error("Error executing admin action:", error);
    return `Error executing action: ${(error as Error).message}`;
  }
};

// Original function to parse and execute an admin action
export const executeAdminAction2 = async (action: AdminAction): Promise<string> => {
  try {
    let user: User | null = null;
    
    // Find the target user
    if (action.targetEmail) {
      user = await getUserByEmail(action.targetEmail);
    } else if (action.targetUsername) {
      user = await lookupUser(action.targetUsername);
    } else if (action.targetUserId) {
      const allUsers = await getUsers();
      user = allUsers.find(u => u.id === action.targetUserId) || null;
    }
    
    if (!user) {
      return "User not found. Please provide a valid username, email, or user ID.";
    }
    
    // Execute the requested action
    switch (action.type) {
      case 'suspend_user':
        await updateUserStatus(user.id, 'suspended', action.message || 'Account suspended by administrator');
        return `User ${user.username || user.email} has been suspended.`;
        
      case 'warn_user':
        await updateUserStatus(user.id, 'warned', action.message || 'Account warning issued by administrator');
        return `User ${user.username || user.email} has been warned.`;
        
      case 'activate_user':
        await updateUserStatus(user.id, 'active');
        return `User ${user.username || user.email} has been activated.`;
        
      case 'suspend_license':
        if (!user.licenseKey) {
          return `User ${user.username || user.email} does not have an active license.`;
        }
        await suspendLicense(user.licenseKey);
        return `License for user ${user.username || user.email} has been suspended.`;
        
      case 'revoke_license':
        if (!user.licenseKey) {
          return `User ${user.username || user.email} does not have an active license.`;
        }
        await revokeLicense(user.licenseKey);
        return `License for user ${user.username || user.email} has been revoked.`;
        
      case 'user_details':
        return `User Details:
Username: ${user.username || 'Not set'}
Email: ${user.email}
Status: ${user.status}
Role: ${user.role}
License: ${user.licenseActive ? 'Active' : 'Inactive'} (${user.licenseType || 'None'})
Account created: ${user.createdAt || 'Unknown date'}
Last login: ${user.lastLogin || 'Never'}`;
        
      case 'user_list':
        // This should be handled elsewhere as it doesn't target a specific user
        return "User list action should be processed differently.";
        
      default:
        return `Unknown action type: ${action.type}`;
    }
  } catch (error) {
    console.error("Error executing admin action:", error);
    return `Error executing action: ${(error as Error).message}`;
  }
};
