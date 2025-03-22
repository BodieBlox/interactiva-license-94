
// OpenAI API utility for chat-related functions

// OpenAI API key - this should ideally be stored securely server-side
const OPENAI_API_KEY = "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";

/**
 * Generate a response from OpenAI's API
 * @param userMessageContent The user's message content
 * @param isAdmin Whether the user is an admin
 * @returns The AI generated response
 */
export const generateAIResponse = async (userMessageContent: string, isAdmin: boolean = false): Promise<string> => {
  try {
    // Determine system prompt based on user role
    const systemPrompt = isAdmin 
      ? `You are an AI assistant for the CentralAI platform administrators. You can help admins manage their platform by:
         - Providing information about users, licenses, and system status
         - Assisting with administrative tasks like user management
         - Offering suggestions for improving platform operations
         
         You understand that administrators have special permissions and can help them execute their duties efficiently.`
      : 'You are a helpful assistant.';
    
    // Call OpenAI API to generate a response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessageContent }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error(`OpenAI API returned ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
};
