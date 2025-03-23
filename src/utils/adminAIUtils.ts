
import { getUsers, getUserByEmail, getUserByUsername, updateUserStatus, suspendLicense, revokeLicense, clearUserChatHistory, User } from './api';
import { toast } from '@/components/ui/use-toast';

type AdminIntent = 'warn' | 'suspend' | 'activate' | 'clearChats' | 'suspendLicense' | 'revokeLicense' | null;

interface AdminAction {
  intent: AdminIntent;
  userId: string;
  data?: any;
}

// Improved function to parse admin intent from a user message
export const parseAdminIntent = (message: string): AdminAction | null => {
  message = message.toLowerCase().trim();
  
  console.log("Parsing admin intent from message:", message);
  
  // Patterns for different actions
  const warnPattern = /(warn|warning|issue warning to|warn user|issue a warning to) ([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9_-]+)/i;
  const suspendPattern = /(suspend|ban|block|disable|deactivate) (user|account)? ?([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9_-]+)/i;
  const activatePattern = /(activate|enable|restore|unsuspend|unban) (user|account)? ?([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9_-]+)/i;
  const clearChatsPattern = /(clear|delete|remove) (chats?|messages?|history|conversation) (for|of|from) (user|account)? ?([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9_-]+)/i;
  const suspendLicensePattern = /(suspend|disable|deactivate) (license|licence) (for|of|from) (user|account)? ?([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9_-]+)/i;
  const revokeLicensePattern = /(revoke|remove|delete) (license|licence) (for|of|from) (user|account)? ?([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9_-]+)/i;
  
  // Extract reason if present (after "for" or "because")
  const reasonPattern = /(for|because|due to|as|since) (.+)$/i;
  
  let match;
  let intent: AdminIntent = null;
  let userIdentifier = '';
  let reason = '';
  
  // Check for reason in the message
  const reasonMatch = message.match(reasonPattern);
  if (reasonMatch) {
    reason = reasonMatch[2].trim();
    // Remove the reason part from the message for cleaner matching
    message = message.replace(reasonMatch[0], '').trim();
  }
  
  // Try to match against the patterns
  if ((match = message.match(warnPattern))) {
    intent = 'warn';
    userIdentifier = match[2];
  } else if ((match = message.match(suspendPattern))) {
    intent = 'suspend';
    userIdentifier = match[3];
  } else if ((match = message.match(activatePattern))) {
    intent = 'activate';
    userIdentifier = match[3];
  } else if ((match = message.match(clearChatsPattern))) {
    intent = 'clearChats';
    userIdentifier = match[5];
  } else if ((match = message.match(suspendLicensePattern))) {
    intent = 'suspendLicense';
    userIdentifier = match[5];
  } else if ((match = message.match(revokeLicensePattern))) {
    intent = 'revokeLicense';
    userIdentifier = match[5];
  }
  
  if (!intent || !userIdentifier) {
    console.log("No admin intent or user identified");
    return null;
  }
  
  console.log(`Admin intent detected: ${intent} for user: ${userIdentifier}`);
  
  return {
    intent,
    userId: userIdentifier,
    data: reason ? { reason } : {}
  };
};

// Execute the admin action
export const executeAdminAction = async (
  intent: AdminIntent,
  userIdentifier: string,
  data?: any
): Promise<boolean> => {
  try {
    console.log(`Executing ${intent} action for user: ${userIdentifier}`, data);
    
    // Find the user - could be by email, username, or ID
    let user: User | null = null;
    
    if (userIdentifier.includes('@')) {
      // Likely an email
      user = await getUserByEmail(userIdentifier);
    } else {
      // Try username first, then ID
      user = await getUserByUsername(userIdentifier);
      
      if (!user) {
        // Try direct ID lookup if no user found by username
        const allUsers = await getUsers();
        user = allUsers.find(u => u.id === userIdentifier) || null;
      }
    }
    
    if (!user) {
      console.error(`User not found for identifier: ${userIdentifier}`);
      toast({
        title: "Action Failed",
        description: `User not found: ${userIdentifier}`,
        variant: "destructive"
      });
      return false;
    }
    
    // Execute the appropriate action
    switch(intent) {
      case 'warn':
        await updateUserStatus(
          user.id, 
          'warned', 
          data?.reason || 'Administrative warning'
        );
        toast({
          title: "Action Completed",
          description: `Warning issued to ${user.username || user.email}`,
          variant: "default"
        });
        break;
        
      case 'suspend':
        await updateUserStatus(
          user.id, 
          'suspended', 
          data?.reason || 'Administrative suspension'
        );
        toast({
          title: "Action Completed",
          description: `User ${user.username || user.email} has been suspended`,
          variant: "default"
        });
        break;
        
      case 'activate':
        await updateUserStatus(user.id, 'active', null);
        toast({
          title: "Action Completed",
          description: `User ${user.username || user.email} has been activated`,
          variant: "default"
        });
        break;
        
      case 'clearChats':
        await clearUserChatHistory(user.id);
        toast({
          title: "Action Completed",
          description: `Chat history cleared for ${user.username || user.email}`,
          variant: "default"
        });
        break;
        
      case 'suspendLicense':
        if (user.licenseKey) {
          await suspendLicense(user.licenseKey);
          toast({
            title: "Action Completed",
            description: `License suspended for ${user.username || user.email}`,
            variant: "default"
          });
        } else {
          toast({
            title: "Action Failed",
            description: `User does not have an active license`,
            variant: "destructive"
          });
          return false;
        }
        break;
        
      case 'revokeLicense':
        if (user.licenseKey) {
          await revokeLicense(user.licenseKey);
          toast({
            title: "Action Completed",
            description: `License revoked for ${user.username || user.email}`,
            variant: "default"
          });
        } else {
          toast({
            title: "Action Failed",
            description: `User does not have an active license`,
            variant: "destructive"
          });
          return false;
        }
        break;
        
      default:
        console.error(`Unknown action: ${intent}`);
        return false;
    }
    
    console.log(`Action ${intent} completed successfully for user: ${user.id}`);
    return true;
    
  } catch (error) {
    console.error(`Error executing admin action ${intent}:`, error);
    toast({
      title: "Action Failed",
      description: `Error executing ${intent} action: ${(error as Error).message}`,
      variant: "destructive"
    });
    return false;
  }
};
