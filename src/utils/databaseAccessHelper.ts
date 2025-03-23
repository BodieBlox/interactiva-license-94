/**
 * Database Access Helper
 * 
 * This utility provides structured methods for the AI to interact with database data
 * in a safe and controlled manner. It centralizes data fetching and transformation
 * logic to improve AI's ability to work with application data.
 */

import { getUsers, getLoginLogs, getUserChats } from './api';
import { User, ChatMessage, LoginLog, Chat } from './types';
import { getCompanies, getCompanyMembers } from './companyApi';
import { Company, UserWithCompany } from './companyTypes';

/**
 * Fetches all available user data and formats it for AI consumption
 */
export const fetchUsersForAI = async (): Promise<{
  users: Partial<User>[];
  count: number;
  roles: { [key: string]: number };
  statuses: { [key: string]: number };
}> => {
  try {
    const users = await getUsers();
    
    // Count users by role
    const roles: { [key: string]: number } = {};
    // Count users by status
    const statuses: { [key: string]: number } = {};
    
    // Only send necessary user data to the AI
    const safeUsers = users.map(user => {
      // Count roles
      roles[user.role] = (roles[user.role] || 0) + 1;
      // Count statuses
      statuses[user.status || 'active'] = (statuses[user.status || 'active'] || 0) + 1;
      
      // Return safe user object (no sensitive data)
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        licenseActive: user.licenseActive,
        isCompanyMember: user.customization?.isCompanyMember || false,
        companyId: user.customization?.companyId,
        lastLogin: user.lastLogin
      };
    });
    
    return {
      users: safeUsers,
      count: users.length,
      roles,
      statuses
    };
  } catch (error) {
    console.error('Error fetching users for AI:', error);
    throw new Error('Failed to fetch user data');
  }
};

/**
 * Fetches company data and formats it for AI consumption
 */
export const fetchCompaniesForAI = async (): Promise<{
  companies: Partial<Company>[];
  count: number;
  memberCounts: { [key: string]: number };
}> => {
  try {
    const companies = await getCompanies();
    const memberCounts: { [key: string]: number } = {};
    
    // For each company, get its members and count them
    for (const company of companies) {
      const members = await getCompanyMembers(company.id);
      memberCounts[company.id] = members.length;
    }
    
    // Only send necessary company data to the AI
    const safeCompanies = companies.map(company => {
      return {
        id: company.id,
        name: company.name,
        // Only include these properties if they exist on the company object
        ...(company.description ? { description: company.description } : {}),
        ...(company.industry ? { industry: company.industry } : {}),
        ...(company.size ? { size: company.size } : {}),
        createdAt: company.createdAt,
        memberCount: memberCounts[company.id] || 0,
        hasBranding: !!company.branding
      };
    });
    
    return {
      companies: safeCompanies,
      count: companies.length,
      memberCounts
    };
  } catch (error) {
    console.error('Error fetching companies for AI:', error);
    throw new Error('Failed to fetch company data');
  }
};

/**
 * Fetches chat data and formats it for AI consumption
 */
export const fetchChatMessagesForAI = async (userId: string): Promise<{
  messageCount: number;
  recentConversations: number;
  averageLength: number;
  topCategories: string[];
}> => {
  try {
    const chats = await getUserChats(userId);
    let allMessages: ChatMessage[] = [];
    
    // Extract all messages from all chats
    chats.forEach(chat => {
      if (chat.messages && Array.isArray(chat.messages)) {
        allMessages = [...allMessages, ...chat.messages];
      }
    });
    
    // Calculate statistics
    const conversationIds = chats.map(chat => chat.id);
    const recentConversations = conversationIds.length;
    const messageCount = allMessages.length;
    
    // Calculate average message length for user messages only
    const userMessages = allMessages.filter(m => m.role === 'user');
    const totalLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0);
    const averageLength = userMessages.length > 0 ? Math.round(totalLength / userMessages.length) : 0;
    
    // Extract basic categories based on content (simplified)
    const categories = new Map<string, number>();
    userMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      if (content.includes('help') || content.includes('how')) categories.set('help', (categories.get('help') || 0) + 1);
      if (content.includes('bug') || content.includes('error')) categories.set('troubleshooting', (categories.get('troubleshooting') || 0) + 1);
      if (content.includes('feature') || content.includes('add')) categories.set('feature request', (categories.get('feature request') || 0) + 1);
      if (content.includes('thank') || content.includes('good')) categories.set('feedback', (categories.get('feedback') || 0) + 1);
    });
    
    // Sort categories by count
    const topCategories = [...categories.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
    
    return {
      messageCount,
      recentConversations,
      averageLength,
      topCategories
    };
  } catch (error) {
    console.error('Error fetching chat messages for AI:', error);
    throw new Error('Failed to fetch chat data');
  }
};

/**
 * Fetches login activity data and formats it for AI consumption
 */
export const fetchLoginActivityForAI = async (): Promise<{
  recentLogins: number;
  uniqueIPs: number;
  mostActiveUser?: string;
  loginsByDay: { [key: string]: number };
}> => {
  try {
    const loginLogs = await getLoginLogs();
    const users = await getUsers();
    
    // Count logins by user
    const loginsByUser: { [key: string]: number } = {};
    loginLogs.forEach(log => {
      loginsByUser[log.userId] = (loginsByUser[log.userId] || 0) + 1;
    });
    
    // Find most active user
    let mostActiveUserId = '';
    let mostLogins = 0;
    for (const [userId, count] of Object.entries(loginsByUser)) {
      if (count > mostLogins) {
        mostLogins = count;
        mostActiveUserId = userId;
      }
    }
    
    const mostActiveUser = users.find(u => u.id === mostActiveUserId)?.username || '';
    
    // Count unique IPs
    const uniqueIPs = new Set(loginLogs.map(log => log.ip)).size;
    
    // Group logins by day - with date validation
    const loginsByDay: { [key: string]: number } = {};
    loginLogs.forEach(log => {
      try {
        // Safely parse the timestamp and format it
        const timestamp = new Date(log.timestamp);
        
        // Validate that the timestamp is a valid date before using toISOString
        if (!isNaN(timestamp.getTime())) {
          const date = timestamp.toISOString().split('T')[0];
          loginsByDay[date] = (loginsByDay[date] || 0) + 1;
        } else {
          console.warn(`Invalid timestamp in login log: ${log.timestamp}`);
        }
      } catch (err) {
        console.warn(`Error parsing timestamp in login log: ${log.timestamp}`, err);
      }
    });
    
    return {
      recentLogins: loginLogs.length,
      uniqueIPs,
      mostActiveUser,
      loginsByDay
    };
  } catch (error) {
    console.error('Error fetching login activity for AI:', error);
    throw new Error('Failed to fetch login activity data');
  }
};

/**
 * Master function to get comprehensive system data for AI
 */
export const getSystemOverviewForAI = async (): Promise<{
  users: {
    count: number;
    roles: { [key: string]: number };
    statuses: { [key: string]: number };
  };
  companies: {
    count: number;
  };
  activity: {
    recentLogins: number;
    uniqueIPs: number;
  };
}> => {
  try {
    const usersData = await fetchUsersForAI();
    const companiesData = await fetchCompaniesForAI();
    const activityData = await fetchLoginActivityForAI();
    
    return {
      users: {
        count: usersData.count,
        roles: usersData.roles,
        statuses: usersData.statuses
      },
      companies: {
        count: companiesData.count
      },
      activity: {
        recentLogins: activityData.recentLogins,
        uniqueIPs: activityData.uniqueIPs
      }
    };
  } catch (error) {
    console.error('Error getting system overview for AI:', error);
    throw new Error('Failed to get system overview');
  }
};
