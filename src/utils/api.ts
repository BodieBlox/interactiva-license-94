import { database } from './firebase';
import { ref, get, set, update, push } from 'firebase/database';
import { User, Chat, ChatMessage, License, LicenseRequest, LoginLog } from './types';

// User functions
export const createUser = async (user: User): Promise<void> => {
  try {
    const userRef = ref(database, `users/${user.id}`);
    await set(userRef, user);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, updates);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    await set(userRef, null);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      console.log("No users found");
      return [];
    }
    
    const users: User[] = [];
    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val() as User;
      users.push(user);
    });
    
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    console.log("Searching for user with email:", email);
    // First try to search directly by path
    const userRef = ref(database, 'users');
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      const userEntry = Object.entries(users).find(([_, userData]: [string, any]) => 
        userData.email === email
      );
      
      if (userEntry) {
        return userEntry[1] as User;
      }
    }
    
    console.log("User not found with email:", email);
    return null;
  } catch (error) {
    console.error("Error searching for user:", error);
    throw error;
  }
};

// Chat functions
export const createChat = async (userId: string, title: string): Promise<Chat> => {
  try {
    const chatRef = ref(database, 'chat');
    const newChatRef = push(chatRef);
    
    const newChat: Chat = {
      id: newChatRef.key as string,
      userId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      isPinned: false
    };
    
    await set(newChatRef, newChat);
    return newChat;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
};

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const chatRef = ref(database, `chat/${chatId}`);
    const snapshot = await get(chatRef);
    
    if (!snapshot.exists()) {
      console.log("Chat not found");
      return null;
    }
    
    const chatData = snapshot.val();
    
    // Normalize messages if they're in object format
    let normalizedMessages: ChatMessage[] = [];
    
    if (chatData.messages) {
      if (Array.isArray(chatData.messages)) {
        normalizedMessages = chatData.messages;
      } else {
        normalizedMessages = Object.entries(chatData.messages).map(([msgId, msgData]: [string, any]) => ({
          id: msgId,
          content: msgData.content,
          role: msgData.role,
          timestamp: msgData.timestamp,
          ...(msgData.isAdminAction !== undefined ? { isAdminAction: msgData.isAdminAction } : {})
        }));
      }
    }
    
    const chat: Chat = {
      id: chatId,
      title: chatData.title || 'New conversation',
      userId: chatData.userId,
      createdAt: chatData.createdAt || new Date().toISOString(),
      updatedAt: chatData.updatedAt || new Date().toISOString(),
      messages: normalizedMessages,
      isPinned: chatData.isPinned || false
    };
    
    return chat;
  } catch (error) {
    console.error("Error fetching chat:", error);
    throw error;
  }
};

export const getChatsByUserId = async (userId: string): Promise<Chat[]> => {
  try {
    console.log("Querying chats for userId:", userId);
    const chatRef = ref(database, 'chat');
    const snapshot = await get(chatRef);
    
    if (!snapshot.exists()) {
      console.log("No chats found");
      return [];
    }
    
    const chats = snapshot.val();
    const userChats: Chat[] = [];
    
    Object.entries(chats).forEach(([id, chatData]: [string, any]) => {
      if (chatData.userId === userId) {
        // Normalize messages if they're in object format
        let normalizedMessages: ChatMessage[] = [];
        
        if (chatData.messages) {
          if (Array.isArray(chatData.messages)) {
            normalizedMessages = chatData.messages;
          } else {
            normalizedMessages = Object.entries(chatData.messages).map(([msgId, msgData]: [string, any]) => ({
              id: msgId,
              content: msgData.content,
              role: msgData.role,
              timestamp: msgData.timestamp,
              ...(msgData.isAdminAction !== undefined ? { isAdminAction: msgData.isAdminAction } : {})
            }));
          }
        }
        
        userChats.push({
          id,
          title: chatData.title || 'New conversation',
          userId: chatData.userId,
          createdAt: chatData.createdAt || new Date().toISOString(),
          updatedAt: chatData.updatedAt || new Date().toISOString(),
          messages: normalizedMessages,
          isPinned: chatData.isPinned || false
        });
      }
    });
    
    console.log(`Found ${userChats.length} chats for user`);
    return userChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error("Error fetching user chats:", error);
    throw error;
  }
};

export const updateChat = async (chatId: string, updates: Partial<Chat>): Promise<void> => {
  try {
    const chatRef = ref(database, `chat/${chatId}`);
    await update(chatRef, updates);
  } catch (error) {
    console.error("Error updating chat:", error);
    throw error;
  }
};

export const deleteChat = async (chatId: string): Promise<void> => {
  try {
    const chatRef = ref(database, `chat/${chatId}`);
    await set(chatRef, null);
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
};

// Message functions
export const sendMessage = async (chatId: string, content: string, role: 'user' | 'assistant'): Promise<ChatMessage | null> => {
  try {
    const messageId = `message-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const message: ChatMessage = {
      id: messageId,
      content,
      role,
      timestamp
    };
    
    const chatRef = ref(database, `chat/${chatId}/messages/${messageId}`);
    await set(chatRef, message);
    
    // Update the chat's updatedAt timestamp
    await update(ref(database, `chat/${chatId}`), {
      updatedAt: timestamp
    });
    
    return message;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const addMessageToChat = async (
  chatId: string, 
  messageData: { content: string; role: 'user' | 'assistant'; isAdminAction?: boolean }
): Promise<ChatMessage | null> => {
  try {
    const messageId = `message-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const message: ChatMessage = {
      id: messageId,
      content: messageData.content,
      role: messageData.role,
      timestamp
    };
    
    // Only add isAdminAction if it's true
    if (messageData.isAdminAction === true) {
      message.isAdminAction = true;
    }
    
    const chatRef = ref(database, `chat/${chatId}/messages/${messageId}`);
    await set(chatRef, message);
    
    // Update the chat's updatedAt timestamp
    await update(ref(database, `chat/${chatId}`), {
      updatedAt: timestamp
    });
    
    return message;
  } catch (error) {
    console.error("Error adding message to chat:", error);
    throw error;
  }
};

export const getMessagesByChatId = async (chatId: string): Promise<ChatMessage[]> => {
  try {
    const messagesRef = ref(database, `chat/${chatId}/messages`);
    const snapshot = await get(messagesRef);
    
    if (!snapshot.exists()) {
      console.log("No messages found for this chat");
      return [];
    }
    
    const messages: ChatMessage[] = [];
    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val() as ChatMessage;
      messages.push(message);
    });
    
    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

// License functions
export const createLicense = async (license: License): Promise<void> => {
  try {
    const licenseRef = ref(database, `licenses/${license.key}`);
    await set(licenseRef, license);
  } catch (error) {
    console.error("Error creating license:", error);
    throw error;
  }
};

export const getLicense = async (licenseId: string): Promise<License | null> => {
    try {
        const licenseRef = ref(database, `licenses/${licenseId}`);
        const snapshot = await get(licenseRef);

        if (snapshot.exists()) {
            return snapshot.val() as License;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching license:", error);
        throw error;
    }
};

export const getLicenseByKey = async (licenseKey: string): Promise<License | null> => {
  try {
    const licensesRef = ref(database, 'licenses');
    const snapshot = await get(licensesRef);
    
    if (!snapshot.exists()) {
      console.log("No licenses found");
      return null;
    }
    
    let foundLicense: License | null = null;
    snapshot.forEach((childSnapshot) => {
      const license = childSnapshot.val() as License;
      if (license.key === licenseKey) {
        foundLicense = license;
      }
    });
    
    return foundLicense;
  } catch (error) {
    console.error("Error fetching license by key:", error);
    throw error;
  }
};

export const updateLicense = async (licenseId: string, updates: Partial<License>): Promise<void> => {
  try {
    const licenseRef = ref(database, `licenses/${licenseId}`);
    await update(licenseRef, updates);
  } catch (error) {
    console.error("Error updating license:", error);
    throw error;
  }
};

export const deleteLicense = async (licenseId: string): Promise<void> => {
  try {
    const licenseRef = ref(database, `licenses/${licenseId}`);
    await set(licenseRef, null);
  } catch (error) {
    console.error("Error deleting license:", error);
    throw error;
  }
};

export const getAllLicenses = async (): Promise<License[]> => {
  try {
    const licensesRef = ref(database, 'licenses');
    const snapshot = await get(licensesRef);
    
    if (!snapshot.exists()) {
      console.log("No licenses found");
      return [];
    }
    
    const licenses: License[] = [];
    snapshot.forEach((childSnapshot) => {
      const license = childSnapshot.val() as License;
      licenses.push(license);
    });
    
    return licenses;
  } catch (error) {
    console.error("Error fetching all licenses:", error);
    throw error;
  }
};

// License Request functions
export const createLicenseRequest = async (userId: string, username: string, email: string, message?: string): Promise<void> => {
  try {
    const licenseRequestsRef = ref(database, 'licenseRequests');
    const newRequestRef = push(licenseRequestsRef);
    
    const newRequest: LicenseRequest = {
      id: newRequestRef.key as string,
      userId,
      username,
      email,
      message,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    await set(newRequestRef, newRequest);
  } catch (error) {
    console.error("Error creating license request:", error);
    throw error;
  }
};

export const getLicenseRequest = async (requestId: string): Promise<LicenseRequest | null> => {
    try {
        const requestRef = ref(database, `licenseRequests/${requestId}`);
        const snapshot = await get(requestRef);

        if (snapshot.exists()) {
            return snapshot.val() as LicenseRequest;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching license request:", error);
        throw error;
    }
};

export const updateLicenseRequest = async (requestId: string, updates: Partial<LicenseRequest>): Promise<void> => {
  try {
    const requestRef = ref(database, `licenseRequests/${requestId}`);
    await update(requestRef, updates);
  } catch (error) {
    console.error("Error updating license request:", error);
    throw error;
  }
};

export const deleteLicenseRequest = async (requestId: string): Promise<void> => {
  try {
    const requestRef = ref(database, `licenseRequests/${requestId}`);
    await set(requestRef, null);
  } catch (error) {
    console.error("Error deleting license request:", error);
    throw error;
  }
};

export const getLicenseRequests = async (): Promise<LicenseRequest[]> => {
  try {
    const licenseRequestsRef = ref(database, 'licenseRequests');
    const snapshot = await get(licenseRequestsRef);
    
    if (!snapshot.exists()) {
      console.log("No license requests found");
      return [];
    }
    
    const licenseRequests: LicenseRequest[] = [];
    snapshot.forEach((childSnapshot) => {
      const request = childSnapshot.val() as LicenseRequest;
      licenseRequests.push(request);
    });
    
    return licenseRequests;
  } catch (error) {
    console.error("Error fetching license requests:", error);
    throw error;
  }
};

// Login Log functions
export const logUserLogin = async (userId: string, details: { ip: string; userAgent: string }): Promise<void> => {
  try {
    const loginLogsRef = ref(database, 'loginLogs');
    const newLogRef = push(loginLogsRef);
    
    const newLog: LoginLog = {
      id: newLogRef.key as string,
      userId,
      timestamp: new Date().toISOString(),
      ip: details.ip,
      userAgent: details.userAgent
    };
    
    await set(newLogRef, newLog);
  } catch (error) {
    console.error("Error logging user login:", error);
    throw error;
  }
};

export const getLoginLogs = async (): Promise<LoginLog[]> => {
  try {
    const loginLogsRef = ref(database, 'loginLogs');
    const snapshot = await get(loginLogsRef);
    
    if (!snapshot.exists()) {
      console.log("No login logs found");
      return [];
    }
    
    const loginLogs: LoginLog[] = [];
    snapshot.forEach((childSnapshot) => {
      const log = childSnapshot.val() as LoginLog;
      loginLogs.push(log);
    });
    
    return loginLogs;
  } catch (error) {
    console.error("Error fetching login logs:", error);
    throw error;
  }
};
