
import { AdminAction, User } from './types';
import { getUsers, updateUserStatus, suspendLicense, revokeLicense } from './api';
import { generateAIResponse } from './openai';

/**
 * Parse admin intent from a message to determine if it's an admin action request
 * @param message The message from an admin user
 * @returns AdminAction object if message contains admin intent, null otherwise
 */
export const parseAdminIntent = async (message: string): Promise<AdminAction | null> => {
  // Only attempt to parse admin intents for messages that seem like admin commands
  if (!message.toLowerCase().includes('user') && 
      !message.toLowerCase().includes('admin') && 
      !message.toLowerCase().includes('suspend') && 
      !message.toLowerCase().includes('warn') && 
      !message.toLowerCase().includes('license') && 
      !message.toLowerCase().includes('revoke') && 
      !message.toLowerCase().includes('show') && 
      !message.toLowerCase().includes('list') && 
      !message.toLowerCase().includes('get')) {
    return null;
  }

  try {
    // Prompt for the AI to parse admin intent
    const prompt = `
    You are an AI assistant that helps identify admin actions from text commands. Given the following admin request, extract the exact action needed and structure it as JSON.
    
    Command: "${message}"
    
    Valid action types:
    - user_list (list all users or filtered users)
    - user_details (get details for a specific user)
    - suspend_user (suspend a user account)
    - warn_user (send a warning to a user)
    - activate_user (activate a suspended user account)
    - revoke_license (completely revoke a user's license)
    - suspend_license (temporarily suspend a user's license)
    
    Extract any user identifiers like username, email, or user ID if present.
    For warnings or suspensions, extract the reason/message if provided.
    
    Return ONLY valid JSON that matches this format:
    {
      "type": "action_type",
      "targetUserId": "user_id_if_mentioned",
      "targetUsername": "username_if_mentioned",
      "targetEmail": "email_if_mentioned",
      "message": "warning_or_suspension_message_if_provided"
    }
    
    If the command does not match any admin action, return: {"type": null}
    `;

    const response = await generateAIResponse(prompt);
    
    // Try to parse the response as JSON
    try {
      const parsedAction = JSON.parse(response);
      if (parsedAction.type === null) {
        return null;
      }
      return parsedAction as AdminAction;
    } catch (e) {
      console.error('Failed to parse admin action JSON:', e);
      return null;
    }
  } catch (error) {
    console.error('Error parsing admin intent:', error);
    return null;
  }
};

/**
 * Execute an admin action and return the result
 * @param action The admin action to execute
 * @returns Result of the admin action as a formatted string
 */
export const executeAdminAction = async (action: AdminAction): Promise<string> => {
  try {
    switch (action.type) {
      case 'user_list': {
        const users = await getUsers();
        // Filter users if criteria provided
        let filteredUsers = users;
        
        if (action.targetUsername) {
          const searchTerm = action.targetUsername.toLowerCase();
          filteredUsers = users.filter(user => 
            user.username.toLowerCase().includes(searchTerm)
          );
        }
        
        if (action.targetEmail) {
          const searchTerm = action.targetEmail.toLowerCase();
          filteredUsers = filteredUsers.filter(user => 
            user.email.toLowerCase().includes(searchTerm)
          );
        }
        
        // Format the user list as a nice table
        const formattedResult = formatUsersAsTable(filteredUsers);
        
        return formattedResult;
      }
      
      case 'user_details': {
        const users = await getUsers();
        let targetUser: User | undefined;
        
        if (action.targetUserId) {
          targetUser = users.find(user => user.id === action.targetUserId);
        } else if (action.targetUsername) {
          targetUser = users.find(user => 
            user.username.toLowerCase().includes(action.targetUsername!.toLowerCase())
          );
        } else if (action.targetEmail) {
          targetUser = users.find(user => 
            user.email.toLowerCase().includes(action.targetEmail!.toLowerCase())
          );
        }
        
        if (!targetUser) {
          return "No user found matching the provided criteria.";
        }
        
        // Format detailed user information
        return formatUserDetails(targetUser);
      }
      
      case 'suspend_user': {
        if (!action.targetUserId && !action.targetUsername && !action.targetEmail) {
          return "Error: No user identifier provided for suspension.";
        }
        
        const users = await getUsers();
        let targetUser: User | undefined;
        
        if (action.targetUserId) {
          targetUser = users.find(user => user.id === action.targetUserId);
        } else if (action.targetUsername) {
          targetUser = users.find(user => 
            user.username.toLowerCase() === action.targetUsername!.toLowerCase()
          );
        } else if (action.targetEmail) {
          targetUser = users.find(user => 
            user.email.toLowerCase() === action.targetEmail!.toLowerCase()
          );
        }
        
        if (!targetUser) {
          return "Error: User not found.";
        }
        
        const warningMessage = action.message || "Your account has been suspended by an administrator.";
        await updateUserStatus(targetUser.id, 'suspended', warningMessage);
        
        return `User ${targetUser.username} (${targetUser.email}) has been suspended with message: "${warningMessage}"`;
      }
      
      case 'warn_user': {
        if (!action.targetUserId && !action.targetUsername && !action.targetEmail) {
          return "Error: No user identifier provided for warning.";
        }
        
        const users = await getUsers();
        let targetUser: User | undefined;
        
        if (action.targetUserId) {
          targetUser = users.find(user => user.id === action.targetUserId);
        } else if (action.targetUsername) {
          targetUser = users.find(user => 
            user.username.toLowerCase() === action.targetUsername!.toLowerCase()
          );
        } else if (action.targetEmail) {
          targetUser = users.find(user => 
            user.email.toLowerCase() === action.targetEmail!.toLowerCase()
          );
        }
        
        if (!targetUser) {
          return "Error: User not found.";
        }
        
        const warningMessage = action.message || "You have received a warning from an administrator.";
        await updateUserStatus(targetUser.id, 'warned', warningMessage);
        
        return `Warning issued to user ${targetUser.username} (${targetUser.email}) with message: "${warningMessage}"`;
      }
      
      case 'activate_user': {
        if (!action.targetUserId && !action.targetUsername && !action.targetEmail) {
          return "Error: No user identifier provided for activation.";
        }
        
        const users = await getUsers();
        let targetUser: User | undefined;
        
        if (action.targetUserId) {
          targetUser = users.find(user => user.id === action.targetUserId);
        } else if (action.targetUsername) {
          targetUser = users.find(user => 
            user.username.toLowerCase() === action.targetUsername!.toLowerCase()
          );
        } else if (action.targetEmail) {
          targetUser = users.find(user => 
            user.email.toLowerCase() === action.targetEmail!.toLowerCase()
          );
        }
        
        if (!targetUser) {
          return "Error: User not found.";
        }
        
        await updateUserStatus(targetUser.id, 'active');
        
        return `User ${targetUser.username} (${targetUser.email}) has been activated.`;
      }
      
      case 'suspend_license': {
        if (!action.targetUserId && !action.targetUsername && !action.targetEmail) {
          return "Error: No user identifier provided for license suspension.";
        }
        
        const users = await getUsers();
        let targetUser: User | undefined;
        
        if (action.targetUserId) {
          targetUser = users.find(user => user.id === action.targetUserId);
        } else if (action.targetUsername) {
          targetUser = users.find(user => 
            user.username.toLowerCase() === action.targetUsername!.toLowerCase()
          );
        } else if (action.targetEmail) {
          targetUser = users.find(user => 
            user.email.toLowerCase() === action.targetEmail!.toLowerCase()
          );
        }
        
        if (!targetUser) {
          return "Error: User not found.";
        }
        
        if (!targetUser.licenseKey) {
          return `Error: User ${targetUser.username} does not have an active license.`;
        }
        
        await suspendLicense(targetUser.licenseKey);
        
        return `License for user ${targetUser.username} (${targetUser.email}) has been suspended.`;
      }
      
      case 'revoke_license': {
        if (!action.targetUserId && !action.targetUsername && !action.targetEmail) {
          return "Error: No user identifier provided for license revocation.";
        }
        
        const users = await getUsers();
        let targetUser: User | undefined;
        
        if (action.targetUserId) {
          targetUser = users.find(user => user.id === action.targetUserId);
        } else if (action.targetUsername) {
          targetUser = users.find(user => 
            user.username.toLowerCase() === action.targetUsername!.toLowerCase()
          );
        } else if (action.targetEmail) {
          targetUser = users.find(user => 
            user.email.toLowerCase() === action.targetEmail!.toLowerCase()
          );
        }
        
        if (!targetUser) {
          return "Error: User not found.";
        }
        
        if (!targetUser.licenseKey) {
          return `Error: User ${targetUser.username} does not have an active license.`;
        }
        
        await revokeLicense(targetUser.licenseKey);
        
        return `License for user ${targetUser.username} (${targetUser.email}) has been revoked.`;
      }
      
      default:
        return "Unrecognized admin action. Please try a different command.";
    }
  } catch (error) {
    console.error('Error executing admin action:', error);
    return `Error executing admin action: ${(error as Error).message}`;
  }
};

/**
 * Format a list of users as a markdown table
 * @param users The users to format
 * @returns A markdown table string
 */
const formatUsersAsTable = (users: User[]): string => {
  if (users.length === 0) {
    return "No users found matching the criteria.";
  }
  
  const headers = ["Username", "Email", "Status", "License", "Role"];
  const rows = users.map(user => [
    user.username,
    user.email,
    user.status,
    user.licenseActive ? "Active" : "Inactive",
    user.role
  ]);
  
  // Calculate maximum width for each column
  const colWidths = headers.map((header, i) => {
    const maxRowWidth = Math.max(...rows.map(row => row[i].length));
    return Math.max(header.length, maxRowWidth);
  });
  
  // Build the table header
  let table = '| ' + headers.map((header, i) => 
    header.padEnd(colWidths[i], ' ')
  ).join(' | ') + ' |\n';
  
  // Build the separator row
  table += '| ' + colWidths.map(width => 
    '-'.repeat(width)
  ).join(' | ') + ' |\n';
  
  // Build the data rows
  table += rows.map(row => 
    '| ' + row.map((cell, i) => 
      cell.padEnd(colWidths[i], ' ')
    ).join(' | ') + ' |'
  ).join('\n');
  
  return `Here are the users matching your query:\n\n${table}`;
};

/**
 * Format detailed user information
 * @param user The user to format details for
 * @returns A formatted string with user details
 */
const formatUserDetails = (user: User): string => {
  return `
## User Details for ${user.username}

- **ID**: ${user.id}
- **Email**: ${user.email}
- **Role**: ${user.role}
- **Status**: ${user.status}
- **License Active**: ${user.licenseActive ? "Yes" : "No"}
- **License Type**: ${user.licenseType || "N/A"}
- **License Key**: ${user.licenseKey || "N/A"}
- **License ID**: ${user.licenseId || "N/A"}
- **License Expiry**: ${user.licenseExpiryDate ? new Date(user.licenseExpiryDate).toLocaleDateString() : "N/A"}
- **Company Admin**: ${user.isCompanyAdmin ? "Yes" : "No"}
- **Warning Message**: ${user.warningMessage || "None"}
- **Last Login**: ${user.lastLogin ? new Date(user.lastLogin.timestamp).toLocaleString() : "Never"}
`;
};
