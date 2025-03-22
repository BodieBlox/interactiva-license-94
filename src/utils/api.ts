
// This is just the sendMessage function to ensure it's consistent
export const sendMessage = async (chatId: string, content: string) => {
  try {
    const messageId = `msg_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const newMessage = {
      id: messageId,
      content,
      role: 'user',
      timestamp
    };
    
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/chats/${chatId}/messages/${messageId}.json`, {
      method: 'PUT',
      body: JSON.stringify(newMessage),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    // Also update the chat's updatedAt timestamp
    await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/chats/${chatId}/updatedAt.json`, {
      method: 'PUT',
      body: JSON.stringify(timestamp),
    });
    
    return newMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
