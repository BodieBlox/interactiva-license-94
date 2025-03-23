
// OpenAI API utility for chat-related functions

// OpenAI API key - this should ideally be stored securely server-side
const OPENAI_API_KEY = "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";

import { User, ChatMessage, Chat } from './types';
import { getUsers, getAllChats, getAllLicenses, getLicenseRequests, getLoginLogs } from './api';

/**
 * Generate a response from OpenAI's API
 * @param userMessageContent The user's message content
 * @param conversation Previous messages in the conversation
 * @param isAdmin Whether the user is an admin
 * @returns The AI generated response
 */
export const generateAIResponse = async (
  userMessageContent: string, 
  conversation: ChatMessage[] = [],
  isAdmin: boolean = false
): Promise<string> => {
  try {
    // Determine system prompt based on user role
    let systemPrompt = isAdmin 
      ? `You are an AI assistant for the CentralAI platform administrators. You can help admins manage their platform by:
         - Providing information about users, licenses, and system status
         - Assisting with administrative tasks like user management
         - Offering suggestions for improving platform operations
         
         You understand that administrators have special permissions and can help them execute their duties efficiently.`
      : 'You are a helpful assistant.';
    
    // For admin users, fetch database information
    let databaseContext = '';
    if (isAdmin) {
      try {
        const users = await getUsers();
        const licenses = await getAllLicenses();
        const licenseRequests = await getLicenseRequests();
        const loginLogs = await getLoginLogs();
        
        // Add a summary of database information to the system prompt
        databaseContext = `
        Here is the current database state (ADMIN ACCESS ONLY):
        
        Users summary: ${users.length} total users
        Licenses summary: ${licenses.length} total licenses
        License requests summary: ${licenseRequests.length} pending requests
        Recent logins: ${loginLogs.slice(0, 5).map(log => `${log.userId} at ${log.timestamp}`).join(', ')}
        
        If the admin asks for specific database information, you can provide it. 
        If they ask for a detailed report, you can generate it using this data.
        `;
        
        systemPrompt += databaseContext;
      } catch (error) {
        console.error('Error fetching database context:', error);
      }
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
    const users = await getUsers();
    const licenses = await getAllLicenses();
    const licenseRequests = await getLicenseRequests();
    const loginLogs = await getLoginLogs();
    
    const databaseSnapshot = {
      users,
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
