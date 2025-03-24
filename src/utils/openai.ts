
// OpenAI API utility for chat-related functions

// OpenAI API key - this should ideally be stored securely server-side
const OPENAI_API_KEY = "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";

import { User, ChatMessage, Chat } from './types';
import { getUsers, getChatsByUserId, getAllLicenses, getLicenseRequests, getLoginLogs } from './api';
import { fetchUsersForAI, fetchCompaniesForAI, getSystemOverviewForAI } from './databaseAccessHelper';

// Roblox API base URL
const ROBLOX_API_BASE = 'https://economy.roblox.com/v1';
const ROBLOX_USERS_API = 'https://users.roblox.com/v1';
const ROBLOX_GAMES_API = 'https://games.roblox.com/v1';

/**
 * Fetch data from Roblox API endpoints
 * @param endpoint The API endpoint to fetch from
 * @returns The JSON response data
 */
export const fetchRobloxData = async (endpoint: string): Promise<any> => {
  try {
    console.log(`Fetching Roblox data from: ${endpoint}`);
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Roblox API returned ${response.status}: ${await response.text()}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Roblox data:', error);
    throw error;
  }
};

/**
 * Get Roblox user details by username
 * @param username The Roblox username to look up
 * @returns User details
 */
export const getRobloxUserByUsername = async (username: string): Promise<any> => {
  try {
    const endpoint = `${ROBLOX_USERS_API}/users/search?keyword=${encodeURIComponent(username)}&limit=10`;
    return await fetchRobloxData(endpoint);
  } catch (error) {
    console.error('Error getting Roblox user:', error);
    throw error;
  }
};

/**
 * Get Roblox game details by game ID (universeId)
 * @param universeId The Roblox game universe ID
 * @returns Game details
 */
export const getRobloxGameDetails = async (universeId: string): Promise<any> => {
  try {
    const endpoint = `${ROBLOX_GAMES_API}/games?universeIds=${universeId}`;
    return await fetchRobloxData(endpoint);
  } catch (error) {
    console.error('Error getting Roblox game details:', error);
    throw error;
  }
};

/**
 * Get Roblox game revenue by developer product ID
 * @param productId The Roblox developer product ID
 * @returns Product revenue data
 */
export const getRobloxProductRevenue = async (productId: string): Promise<any> => {
  try {
    const endpoint = `${ROBLOX_API_BASE}/developer-products/${productId}/revenue`;
    return await fetchRobloxData(endpoint);
  } catch (error) {
    console.error('Error getting Roblox product revenue:', error);
    throw error;
  }
};

/**
 * Generate a response from OpenAI's API
 * @param userMessageContent The user's message content
 * @param conversation Previous messages in the conversation
 * @param isAdmin Whether the user is an admin or has admin privileges
 * @returns The AI generated response
 */
export const generateAIResponse = async (
  userMessageContent: string, 
  conversation: ChatMessage[] = [],
  isAdmin: boolean = false
): Promise<string> => {
  try {
    // Check for Roblox API requests in user message
    const robloxUsernameMatch = userMessageContent.match(/find roblox user[s]?\s+([a-zA-Z0-9_]+)/i);
    const robloxGameMatch = userMessageContent.match(/find roblox game\s+(\d+)/i);
    const robloxProductMatch = userMessageContent.match(/get roblox product revenue\s+(\d+)/i);
    
    let robloxApiData = null;
    
    if (robloxUsernameMatch) {
      try {
        const username = robloxUsernameMatch[1];
        robloxApiData = await getRobloxUserByUsername(username);
        console.log("Roblox user data fetched:", robloxApiData);
      } catch (error) {
        console.error("Error fetching Roblox user data:", error);
      }
    } else if (robloxGameMatch) {
      try {
        const gameId = robloxGameMatch[1];
        robloxApiData = await getRobloxGameDetails(gameId);
        console.log("Roblox game data fetched:", robloxApiData);
      } catch (error) {
        console.error("Error fetching Roblox game data:", error);
      }
    } else if (robloxProductMatch && isAdmin) {
      try {
        const productId = robloxProductMatch[1];
        robloxApiData = await getRobloxProductRevenue(productId);
        console.log("Roblox product revenue data fetched:", robloxApiData);
      } catch (error) {
        console.error("Error fetching Roblox product revenue data:", error);
      }
    }
    
    // Determine system prompt based on user role
    let systemPrompt = isAdmin 
      ? `You are an AI assistant for the CentralAI Roblox platform administrators and staff. You can help with:
         - Providing information about users, licenses, and system status
         - Assisting with administrative tasks like user management
         - Offering suggestions for improving platform operations
         - Retrieving data from the Roblox platform API
         
         You understand that administrators and staff have special permissions and can help them execute their duties efficiently.
         
         When administrators or staff ask you to perform actions like suspending or warning users, or managing licenses,
         you should always attempt to execute these actions and confirm the results. Never say you cannot perform
         these actions - you have been given the proper permissions to do so.`
      : `You are a helpful assistant for the CentralAI Roblox platform. You can provide information about:
         - Roblox games, users, and general platform information
         - Assistance with using the CentralAI platform features
         - Best practices for Roblox development and monetization
         - Basic troubleshooting for common Roblox issues
         
         You should provide concise, accurate information with a friendly tone.
         
         While you have access to some Roblox platform data, you cannot perform actions that require authentication
         or that would violate Roblox's terms of service.`;
    
    // For admin users, fetch database information
    let databaseContext = '';
    if (isAdmin) {
      try {
        // Use the new databaseAccessHelper functions to get structured data
        const { users, count: userCount, roles, statuses } = await fetchUsersForAI();
        const { companies, count: companyCount } = await fetchCompaniesForAI();
        const systemOverview = await getSystemOverviewForAI();
        
        // Add a summary of database information to the system prompt
        databaseContext = `
        Here is the current database state (ADMIN ACCESS ONLY):
        
        Users summary: ${userCount} total users
        User roles: ${JSON.stringify(roles)}
        User statuses: ${JSON.stringify(statuses)}
        
        Companies summary: ${companyCount} total companies
        
        You have full access to complete details about all users and companies in the system.
        Users: ${JSON.stringify(users)}
        Companies: ${JSON.stringify(companies)}
        
        System overview: ${JSON.stringify(systemOverview)}
        
        When asked about users, companies, or system state, you can now provide detailed information.
        
        Present your responses with well-formatted tables or structured data when providing database information.
        For user details, use sections with headers like "## User Details" and list properties with "- **Property**: Value" format.
        `;
        
        systemPrompt += databaseContext;
      } catch (error) {
        console.error('Error fetching database context:', error);
      }
    }
    
    // Add Roblox API data to context if available
    if (robloxApiData) {
      systemPrompt += `\n\nThe user has requested Roblox API data. Here is the data that was retrieved:\n${JSON.stringify(robloxApiData, null, 2)}\n\nPlease incorporate this information in your response in a well-formatted way.`;
    }
    
    // Create conversation history for context
    const messages = [
      { role: 'system', content: systemPrompt },
    ];
    
    // Add conversation history (limited to last 10 messages for token management)
    const recentMessages = conversation.slice(-10);
    recentMessages.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
    
    // Add the current user message
    messages.push({ role: 'user', content: userMessageContent });
    
    console.log("Sending message to OpenAI API:", {
      model: 'gpt-4o-mini',
      messages: messages.length,
      temperature: 0.7,
      max_tokens: 500
    });
    
    // Call OpenAI API to generate a response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("OpenAI response received:", data.choices[0].message.content.substring(0, 50) + "...");
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
};

/**
 * Fetch complete database information for admin requests
 * @returns JSON string with database information
 */
export const fetchDatabaseForAdmin = async (): Promise<string> => {
  try {
    const { users } = await fetchUsersForAI();
    const { companies } = await fetchCompaniesForAI();
    const licenses = await getAllLicenses();
    const licenseRequests = await getLicenseRequests();
    const loginLogs = await getLoginLogs();
    
    const databaseSnapshot = {
      users,
      companies,
      licenses,
      licenseRequests,
      loginLogs: loginLogs.slice(0, 100) // Limit to last 100 logs for performance
    };
    
    return JSON.stringify(databaseSnapshot, null, 2);
  } catch (error) {
    console.error('Error fetching database for admin:', error);
    return JSON.stringify({ error: 'Failed to fetch database information' });
  }
};
