
// Import the necessary functions and types
import { getUserByEmail, updateUserStatus, getUsers, updateUser, suspendLicense, revokeLicense } from './api';
import { User, AdminAction } from './types';

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

// Function to parse and execute an admin action
export const executeAdminAction = async (action: AdminAction): Promise<string> => {
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
