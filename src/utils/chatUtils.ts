
import { generateAIResponse } from './openai';
import { Chat, ChatMessage } from './types';

/**
 * Generate an AI title for a conversation based on its content
 * @param messageContent First user message in the conversation
 * @returns AI-generated title
 */
export const generateChatTitle = async (messageContent: string): Promise<string> => {
  try {
    const prompt = `Based on this message, generate a very concise title (3-5 words max) for this conversation. Just respond with the title, nothing else: "${messageContent}"`;
    // Pass an empty array as the conversation history and false for isAdmin
    const title = await generateAIResponse(prompt, [], false);
    return title.replace(/["']/g, '').trim();
  } catch (error) {
    console.error('Error generating chat title:', error);
    return 'New conversation';
  }
};

/**
 * Pin or unpin a conversation
 * @param chatId The ID of the chat to update
 * @param isPinned Whether to pin or unpin the chat
 */
export const updateChatPin = async (chatId: string, isPinned: boolean): Promise<void> => {
  try {
    console.log(`Updating chat ${chatId} pin status to ${isPinned}`);
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/chat/${chatId}.json`, {
      method: 'PATCH',
      body: JSON.stringify({ isPinned }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update chat pin status');
    }
    
    console.log('Chat pin status updated successfully');
    return;
  } catch (error) {
    console.error('Error updating chat pin status:', error);
    throw error;
  }
};

/**
 * Ensures that a chat object has all required properties
 * @param chat The chat object to validate/normalize
 * @returns A chat object with all required properties
 */
export const normalizeChatObject = (chat: any): Chat | null => {
  if (!chat) return null;
  
  // Handle case where Firebase returns messages as an object with keys instead of an array
  let normalizedMessages = [];
  if (chat.messages) {
    if (Array.isArray(chat.messages)) {
      normalizedMessages = chat.messages;
    } else if (typeof chat.messages === 'object') {
      // Convert object of messages to array
      normalizedMessages = Object.values(chat.messages);
    }
  }
  
  return {
    id: chat.id || '',
    userId: chat.userId || '',
    title: chat.title || 'Untitled Conversation',
    messages: normalizedMessages,
    createdAt: chat.createdAt || new Date().toISOString(),
    updatedAt: chat.updatedAt || new Date().toISOString(),
    isPinned: Boolean(chat.isPinned)
  };
};

/**
 * Converts Firebase response format to an array of chats
 * @param data The data returned from Firebase
 * @returns An array of normalized chat objects
 */
export const normalizeChatsData = (data: any): Chat[] => {
  if (!data) return [];
  
  // If data is already an array, normalize each item
  if (Array.isArray(data)) {
    return data.map(chat => normalizeChatObject(chat)).filter(Boolean) as Chat[];
  }
  
  // If data is an object with keys (Firebase format)
  if (typeof data === 'object') {
    return Object.entries(data).map(([id, chatData]) => {
      if (!chatData) return null;
      return normalizeChatObject({
        id,
        ...(chatData as object)
      });
    }).filter(Boolean) as Chat[];
  }
  
  return [];
};
