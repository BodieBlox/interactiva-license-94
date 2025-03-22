
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
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/chats/${chatId}.json`, {
      method: 'PATCH',
      body: JSON.stringify({ isPinned }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update chat pin status');
    }
    
    return;
  } catch (error) {
    console.error('Error updating chat pin status:', error);
    throw error;
  }
};
