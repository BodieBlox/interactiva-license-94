import { database } from './firebase';
import { ref, get, set, update, push, query, orderByChild, equalTo } from 'firebase/database';
import { User, Chat, ChatMessage, License, LicenseRequest, LoginLog } from './types';
import { v4 as uuidv4 } from 'uuid';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';

// User functions
export const createUser = async (userData: User): Promise<User> => {
  console.log('Creating user:', userData);
  
  // First, create the Firebase Authentication account
  try {
    // Create Firebase auth entry using admin SDK (if in admin context)
    // Since we can't directly create auth users from the client, we need to handle differently
    // We'll check if user already exists first
    const auth = getAuth();
    
    // Create a reference in the database first
    const userRef = ref(database, `users/${userData.id}`);
    const userSnapshot = await get(userRef);
    
    if (userSnapshot.exists()) {
      throw new Error('User with this ID already exists');
    }
    
    // Check if email already exists
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      const emailExists = Object.values(users).some((user: any) => user.email === userData.email);
      
      if (emailExists) {
        throw new Error('User with this email already exists');
      }
    }
    
    // For admin-created users, we need to use a different approach
    // Create with Firebase Authentication directly
    if (userData.password) {
      try {
        // Try creating the user in Firebase Auth
        // This only works if we're in a client context and have appropriate permissions
        // Typically this would be done through Firebase Functions for admin operations
        await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        console.log('User created in Firebase Auth');
      } catch (error: any) {
        // If we get a 'already-exists' error, we can proceed with DB creation
        // Otherwise, throw the error
        if (error.code !== 'auth/email-already-in-use') {
          console.error('Error creating Firebase Auth user:', error);
          throw new Error(`Failed to create authentication account: ${error.message}`);
        } else {
          console.log('User already exists in Firebase Auth, proceeding with DB update');
        }
      }
    }
    
    // Store user data in the database (without password)
    const userToSave = { ...userData };
    delete userToSave.password; // Don't store password in database
    
    await set(userRef, userToSave);
    console.log('User created in database');
    
    return userToSave;
  } catch (error) {
    console.error('Error creating user:', error);
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

export const updateUserStatus = async (userId: string, status: User['status'], warningMessage?: string): Promise<User> => {
  try {
    const updates: Partial<User> = { status };
    if (warningMessage !== undefined) {
      updates.warningMessage = warningMessage;
    }

    await updateUser(userId, updates);
    
    // Get and return the updated user
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    return snapshot.val() as User;
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
};

export const updateUsername = async (userId: string, username: string): Promise<void> => {
  return updateUser(userId, { username });
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

// Alias for getUsers to match function names used in components
export const getAllUsers = getUsers;

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    console.log("Searching for user with email:", email);
    const userRef = ref(database, 'users');
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      let foundUser: User | null = null;
      
      // Manually iterate instead of using .find() which had issues
      snapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val() as User;
        if (user.email === email) {
          foundUser = user;
          return true; // Break the forEach loop
        }
        return false;
      });
      
      if (foundUser) {
        return foundUser;
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

// Alias for getChatsByUserId to match function names used in components
export const getUserChats = getChatsByUserId;

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

export const clearUserChatHistory = async (userId: string): Promise<void> => {
  try {
    const userChats = await getChatsByUserId(userId);
    
    // Delete each chat one by one
    const deletePromises = userChats.map(chat => deleteChat(chat.id));
    await Promise.all(deletePromises);
    
    console.log(`Cleared chat history for user ${userId}`);
  } catch (error) {
    console.error("Error clearing chat history:", error);
    throw error;
  }
};

export const getAllChats = async (): Promise<Chat[]> => {
  try {
    const chatRef = ref(database, 'chat');
    const snapshot = await get(chatRef);
    
    if (!snapshot.exists()) {
      console.log("No chats found");
      return [];
    }
    
    const allChats: Chat[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const chatData = childSnapshot.val();
      
      // Normalize messages
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
      
      allChats.push({
        id: childSnapshot.key as string,
        title: chatData.title || 'New conversation',
        userId: chatData.userId,
        createdAt: chatData.createdAt || new Date().toISOString(),
        updatedAt: chatData.updatedAt || new Date().toISOString(),
        messages: normalizedMessages,
        isPinned: chatData.isPinned || false
      });
    });
    
    return allChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.error("Error fetching all chats:", error);
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
    
    // Only add isAdminAction if it's true (avoid undefined values)
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
export const generateLicense = async (type: string, expirationDays?: number, options?: { maxUsers?: number }) => {
  try {
    // Generate a unique license key
    const licenseKey = generateRandomLicenseKey();
    
    // Create the license object
    const license: Partial<License> = {
      key: licenseKey,
      isActive: true,
      status: 'active',
      type: type as 'basic' | 'premium' | 'enterprise',
      createdAt: new Date().toISOString(),
      maxUsers: options?.maxUsers || 5 // Default to 5 users if not specified
    };
    
    // Set expiration if expirationDays is provided
    if (expirationDays) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);
      license.expiresAt = expirationDate.toISOString();
    }
    
    // Save the license to the database
    const licenseRef = push(ref(database, 'licenses'));
    const licenseId = licenseRef.key;
    
    if (!licenseId) {
      throw new Error("Failed to generate license ID");
    }
    
    license.id = licenseId;
    
    await set(licenseRef, license);
    
    return license as License;
  } catch (error) {
    console.error('Error generating license:', error);
    throw error;
  }
};

export const assignLicense = async (userId: string, licenseType: 'basic' | 'premium' | 'enterprise'): Promise<License> => {
  try {
    // Generate a new license of the specified type
    const license = await generateLicense(licenseType, 365); // Default to 1 year
    
    // Assign the license to the user
    await assignLicenseToUser(userId, license.key);
    
    return license;
  } catch (error) {
    console.error("Error assigning license:", error);
    throw error;
  }
};

export const assignLicenseToUser = async (userId: string, licenseKey: string): Promise<void> => {
  try {
    // Find the license
    const license = await getLicenseByKey(licenseKey);
    
    if (!license) {
      throw new Error("License not found");
    }
    
    // Update the license with the user ID
    const licenseRef = ref(database, `licenses/${license.id}`);
    await update(licenseRef, {
      userId,
      isActive: true,
      status: 'active',
      activatedAt: new Date().toISOString()
    });
    
    // Update the user with the license information
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, {
      licenseActive: true,
      licenseKey: licenseKey,
      licenseType: license.type,
      licenseId: license.id
    });
  } catch (error) {
    console.error("Error assigning license to user:", error);
    throw error;
  }
};

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

export const suspendLicense = async (licenseKey: string): Promise<void> => {
  try {
    // Find the license by key
    const license = await getLicenseByKey(licenseKey);
    if (!license) {
      throw new Error("License not found");
    }
    
    // Update license status
    await updateLicense(license.id, {
      isActive: false,
      status: 'suspended',
      suspendedAt: new Date().toISOString()
    });
    
    // Update user's license status if there's a user assigned
    if (license.userId) {
      await updateUser(license.userId, {
        licenseActive: false
      });
    }
  } catch (error) {
    console.error("Error suspending license:", error);
    throw error;
  }
};

export const revokeLicense = async (licenseKey: string): Promise<void> => {
  try {
    // Find the license by key
    const license = await getLicenseByKey(licenseKey);
    if (!license) {
      throw new Error("License not found");
    }
    
    // Update license status
    await updateLicense(license.id, {
      isActive: false,
      status: 'revoked',
      userId: undefined,
      suspendedAt: new Date().toISOString()
    });
    
    // Update user's license status if there's a user assigned
    if (license.userId) {
      await updateUser(license.userId, {
        licenseActive: false,
        licenseKey: undefined,
        licenseType: undefined,
        licenseId: undefined
      });
    }
  } catch (error) {
    console.error("Error revoking license:", error);
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

export const approveLicenseRequest = async (requestId: string, licenseType: string = 'basic'): Promise<void> => {
  try {
    // Get the license request
    const request = await getLicenseRequest(requestId);
    if (!request) {
      throw new Error("License request not found");
    }
    
    // Generate a new license
    const license = await generateLicense(licenseType as 'basic' | 'premium' | 'enterprise', 30); // Default to 30 days
    
    // Assign the license to the user
    await assignLicenseToUser(request.userId, license.key);
    
    // Update the request status
    await updateLicenseRequest(requestId, {
      status: 'approved',
      resolvedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error approving license request:", error);
    throw error;
  }
};

export const rejectLicenseRequest = async (requestId: string, reason: string): Promise<void> => {
  try {
    // Update the request status
    await updateLicenseRequest(requestId, {
      status: 'rejected',
      resolvedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error rejecting license request:", error);
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

export const forceUserLogout = async (userId: string): Promise<void> => {
  try {
    console.log(`Forcing logout for user ${userId}`);
    // Set a forced logout timestamp on the user
    await updateUser(userId, {
      forcedLogout: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error forcing user logout:", error);
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

// Dashboard customization functions
export const updateDashboardCustomization = async (userId: string, customization: Partial<User['customization']>): Promise<User> => {
  try {
    // Get current user
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error("User not found");
    }
    
    const user = snapshot.val() as User;
    
    // Update customization
    const updatedCustomization = {
      ...user.customization,
      ...customization
    };
    
    // Update user
    await update(userRef, {
      customization: updatedCustomization
    });
    
    // Return updated user
    const updatedSnapshot = await get(userRef);
    return updatedSnapshot.val() as User;
  } catch (error) {
    console.error("Error updating dashboard customization:", error);
    throw error;
  }
};

export const approveDashboardCustomization = async (userId: string): Promise<User> => {
  try {
    return updateDashboardCustomization(userId, {
      approved: true
    });
  } catch (error) {
    console.error("Error approving dashboard customization:", error);
    throw error;
  }
};

function generateRandomLicenseKey() {
  return `LIC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}
