import { Chat, ChatMessage, User } from './types';
import { addMessageToChat, updateUserStatus, updateUser, suspendLicense, revokeLicense } from './api';

// Admin intent parsing
export const parseAdminIntent = (message: string): { intent: string; params: Record<string, any> } | null => {
  const adminCommandRegex = /^\/admin\s+(\w+)(?:\s+(.*))?$/i;
  const match = message.match(adminCommandRegex);
  
  if (!match) return null;
  
  const [, intent, paramsString] = match;
  const params: Record<string, any> = {};
  
  if (paramsString) {
    // Parse key=value pairs
    const paramPairs = paramsString.match(/(\w+)=("[^"]*"|\S+)/g) || [];
    paramPairs.forEach(pair => {
      const [key, rawValue] = pair.split('=');
      // Remove quotes if present
      const value = rawValue.startsWith('"') && rawValue.endsWith('"') 
        ? rawValue.slice(1, -1) 
        : rawValue;
      params[key] = value;
    });
  }
  
  return { intent, params };
};

export const executeAdminAction = async (chatId: string, intent: string, params: Record<string, any>): Promise<string> => {
  let actionType = '';
  
  switch (intent.toLowerCase()) {
    case 'suspend':
      actionType = 'suspend_user';
      break;
    case 'warn':
      actionType = 'warn_user';
      break;
    case 'activate':
      actionType = 'activate_user';
      break;
    case 'suspendlicense':
      actionType = 'suspend_license';
      break;
    case 'revokelicense':
      actionType = 'revoke_license';
      break;
    case 'update':
      actionType = 'update_user';
      break;
    default:
      return `Unsupported admin action: ${intent}`;
  }
  
  return processAdminAction(chatId, actionType, params);
};

/**
 * Process admin actions from chat messages
 * @param chatId The chat ID
 * @param actionType The admin action type
 * @param actionParams Parameters for the action
 * @returns A result message
 */
export const processAdminAction = async (
  chatId: string,
  actionType: string,
  actionParams: Record<string, any>
): Promise<string> => {
  let resultMessage = '';
  
  try {
    switch (actionType) {
      case 'suspend_user': {
        const { userId, reason } = actionParams;
        if (!userId) {
          throw new Error('User ID is required for suspend_user action');
        }
        
        await updateUserStatus(userId, 'suspended', reason || 'Suspended by admin via AI assistant');
        resultMessage = `User ${userId} has been suspended.`;
        break;
      }
      
      case 'warn_user': {
        const { userId, message } = actionParams;
        if (!userId) {
          throw new Error('User ID is required for warn_user action');
        }
        
        await updateUserStatus(userId, 'warned', message || 'Warning issued by admin via AI assistant');
        resultMessage = `Warning has been issued to user ${userId}.`;
        break;
      }
      
      case 'activate_user': {
        const { userId } = actionParams;
        if (!userId) {
          throw new Error('User ID is required for activate_user action');
        }
        
        await updateUserStatus(userId, 'active');
        resultMessage = `User ${userId} has been activated.`;
        break;
      }
      
      case 'suspend_license': {
        const { licenseKey } = actionParams;
        if (!licenseKey) {
          throw new Error('License key is required for suspend_license action');
        }
        
        await suspendLicense(licenseKey);
        resultMessage = `License ${licenseKey} has been suspended.`;
        break;
      }
      
      case 'revoke_license': {
        const { licenseKey } = actionParams;
        if (!licenseKey) {
          throw new Error('License key is required for revoke_license action');
        }
        
        await revokeLicense(licenseKey);
        resultMessage = `License ${licenseKey} has been revoked.`;
        break;
      }
      
      case 'update_user': {
        const { userId, ...updates } = actionParams;
        if (!userId) {
          throw new Error('User ID is required for update_user action');
        }
        
        await updateUser(userId, updates);
        resultMessage = `User ${userId} has been updated.`;
        break;
      }
      
      default:
        resultMessage = `Unsupported admin action: ${actionType}`;
    }
    
    // Add a system message to the chat with the action result
    await addMessageToChat(chatId, {
      role: 'assistant',
      content: `Admin action result: ${resultMessage}`,
      isAdminAction: true
    });
    
    return resultMessage;
  } catch (error) {
    const errorMessage = `Error executing admin action: ${(error as Error).message}`;
    console.error(errorMessage);
    
    // Add an error message to the chat
    await addMessageToChat(chatId, {
      role: 'assistant',
      content: `Admin action failed: ${errorMessage}`,
      isAdminAction: true
    });
    
    return errorMessage;
  }
};
