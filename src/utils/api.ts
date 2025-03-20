
import { User, LoginLog, ChatMessage, Chat, LicenseRequest, DashboardCustomization, License } from './types';
import { ref, get, set, update, push, remove, query, orderByChild, equalTo } from 'firebase/database';
import { database, auth } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// User Functions
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      const userArray = Object.values(users) as User[];
      const user = userArray.find(u => u.email === email);
      return user || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      return Object.values(users) as User[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  return getUsers();
};

export const createUser = async (userData: { email: string, password?: string, username?: string, role?: string }) => {
  try {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password || 'password123'
    );
    
    const uid = userCredential.user.uid;
    
    // Create a user document in Realtime Database
    const newUser: User = {
      id: uid,
      username: userData.username || userData.email.split('@')[0],
      email: userData.email,
      role: (userData.role as 'user' | 'admin') || 'user',
      status: 'active',
      licenseActive: false
    };
    
    await set(ref(database, `users/${uid}`), newUser);
    
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id: string, userData: Partial<User>) => {
  try {
    const userRef = ref(database, `users/${id}`);
    await update(userRef, userData);
    
    // Get the updated user
    const snapshot = await get(userRef);
    return snapshot.val() as User;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id: string) => {
  try {
    const userRef = ref(database, `users/${id}`);
    
    // Get user before deleting
    const snapshot = await get(userRef);
    const user = snapshot.val() as User;
    
    // Delete user
    await remove(userRef);
    
    return user;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const updateUsername = async (userId: string, username: string): Promise<User> => {
  return updateUser(userId, { username });
};

export const updateUserStatus = async (userId: string, status: 'active' | 'warned' | 'suspended', warningMessage?: string): Promise<User> => {
  return updateUser(userId, { status, warningMessage });
};

export const updateDashboardCustomization = async (userId: string, customization: DashboardCustomization): Promise<User> => {
  return updateUser(userId, { customization });
};

export const approveDashboardCustomization = async (userId: string): Promise<User> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error('User not found');
    }
    
    const user = snapshot.val() as User;
    if (user.customization) {
      user.customization.approved = true;
      await update(userRef, { customization: user.customization });
    }
    
    return user;
  } catch (error) {
    console.error('Error approving dashboard customization:', error);
    throw error;
  }
};

export const forceUserLogout = async (userId: string) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, { forcedLogout: new Date().toISOString() });
    return { success: true };
  } catch (error) {
    console.error('Error forcing user logout:', error);
    throw error;
  }
};

// License Functions
export const getAllLicenses = async (): Promise<License[]> => {
  try {
    const licensesRef = ref(database, 'licenses');
    const snapshot = await get(licensesRef);
    
    if (snapshot.exists()) {
      const licenses = snapshot.val();
      return Object.values(licenses) as License[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching licenses:', error);
    throw error;
  }
};

export const generateLicense = async () => {
  try {
    const licenseKey = `KEY-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
    
    const newLicense: License = {
      id: licenseKey,
      key: licenseKey,
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      type: 'standard'
    };
    
    await set(ref(database, `licenses/${licenseKey}`), newLicense);
    
    return newLicense;
  } catch (error) {
    console.error('Error generating license:', error);
    throw error;
  }
};

export const createLicense = async () => {
  return generateLicense();
};

export const suspendLicense = async (licenseId: string) => {
  try {
    const licenseRef = ref(database, `licenses/${licenseId}`);
    const snapshot = await get(licenseRef);
    
    if (!snapshot.exists()) {
      throw new Error('License not found');
    }
    
    const license = snapshot.val() as License;
    license.isActive = false;
    license.status = 'inactive';
    license.suspendedAt = new Date().toISOString();
    
    await update(licenseRef, license);
    
    return license;
  } catch (error) {
    console.error('Error suspending license:', error);
    throw error;
  }
};

export const revokeLicense = async (licenseId: string) => {
  try {
    const licenseRef = ref(database, `licenses/${licenseId}`);
    const snapshot = await get(licenseRef);
    
    if (!snapshot.exists()) {
      throw new Error('License not found');
    }
    
    const license = snapshot.val() as License;
    license.isActive = false;
    license.status = 'revoked';
    
    await update(licenseRef, license);
    
    return license;
  } catch (error) {
    console.error('Error revoking license:', error);
    throw error;
  }
};

export const deleteLicense = async (licenseId: string) => {
  try {
    const licenseRef = ref(database, `licenses/${licenseId}`);
    await remove(licenseRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting license:', error);
    throw error;
  }
};

export const assignLicenseToUser = async (userId: string, licenseKey: string) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const licenseRef = ref(database, `licenses/${licenseKey}`);
    
    // Check if user and license exist
    const userSnapshot = await get(userRef);
    const licenseSnapshot = await get(licenseRef);
    
    if (!userSnapshot.exists()) {
      throw new Error('User not found');
    }
    
    if (!licenseSnapshot.exists()) {
      throw new Error('License not found');
    }
    
    // Update user
    await update(userRef, {
      licenseActive: true,
      licenseKey: licenseKey
    });
    
    // Update license
    await update(licenseRef, {
      userId: userId,
      isActive: true,
      activatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error assigning license to user:', error);
    throw error;
  }
};

// Login Logs Functions
export const getLoginLogs = async (): Promise<LoginLog[]> => {
  try {
    const logsRef = ref(database, 'loginLogs');
    const snapshot = await get(logsRef);
    
    if (snapshot.exists()) {
      const logs = snapshot.val();
      return Object.values(logs) as LoginLog[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching login logs:', error);
    throw error;
  }
};

export const logUserLogin = async (userId: string, info: { ip: string, userAgent: string }) => {
  try {
    const logsRef = ref(database, 'loginLogs');
    const newLogRef = push(logsRef);
    
    const newLog: LoginLog = {
      id: newLogRef.key || `log-${Date.now()}`,
      userId,
      ip: info.ip || '0.0.0.0',
      userAgent: info.userAgent || 'Unknown',
      timestamp: new Date().toISOString()
    };
    
    await set(newLogRef, newLog);
    
    return newLog;
  } catch (error) {
    console.error('Error logging user login:', error);
    throw error;
  }
};

// License Request Functions
export const getLicenseRequests = async (): Promise<LicenseRequest[]> => {
  try {
    const requestsRef = ref(database, 'licenseRequests');
    const snapshot = await get(requestsRef);
    
    if (snapshot.exists()) {
      const requests = snapshot.val();
      return Object.values(requests) as LicenseRequest[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching license requests:', error);
    throw error;
  }
};

export const createLicenseRequest = async (userId: string, message?: string) => {
  try {
    // Get user data
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      throw new Error('User not found');
    }
    
    const user = userSnapshot.val() as User;
    
    // Create request
    const requestsRef = ref(database, 'licenseRequests');
    const newRequestRef = push(requestsRef);
    
    const newRequest: LicenseRequest = {
      id: newRequestRef.key || `request-${Date.now()}`,
      userId,
      username: user.username,
      email: user.email,
      status: 'pending',
      message,
      createdAt: new Date().toISOString()
    };
    
    await set(newRequestRef, newRequest);
    
    return newRequest;
  } catch (error) {
    console.error('Error creating license request:', error);
    throw error;
  }
};

export const approveLicenseRequest = async (requestId: string) => {
  try {
    const requestRef = ref(database, `licenseRequests/${requestId}`);
    const snapshot = await get(requestRef);
    
    if (!snapshot.exists()) {
      throw new Error('License request not found');
    }
    
    const request = snapshot.val() as LicenseRequest;
    request.status = 'approved';
    request.resolvedAt = new Date().toISOString();
    
    await update(requestRef, request);
    
    return request;
  } catch (error) {
    console.error('Error approving license request:', error);
    throw error;
  }
};

export const rejectLicenseRequest = async (requestId: string) => {
  try {
    const requestRef = ref(database, `licenseRequests/${requestId}`);
    const snapshot = await get(requestRef);
    
    if (!snapshot.exists()) {
      throw new Error('License request not found');
    }
    
    const request = snapshot.val() as LicenseRequest;
    request.status = 'rejected';
    request.resolvedAt = new Date().toISOString();
    
    await update(requestRef, request);
    
    return request;
  } catch (error) {
    console.error('Error rejecting license request:', error);
    throw error;
  }
};

// Chat Functions
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    const chatsRef = ref(database, 'chats');
    const userChatsQuery = query(chatsRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(userChatsQuery);
    
    if (snapshot.exists()) {
      const chats = snapshot.val();
      return Object.values(chats) as Chat[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching user chats:', error);
    throw error;
  }
};

export const getAllChats = async (): Promise<Chat[]> => {
  try {
    const chatsRef = ref(database, 'chats');
    const snapshot = await get(chatsRef);
    
    if (snapshot.exists()) {
      const chats = snapshot.val();
      return Object.values(chats) as Chat[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching all chats:', error);
    throw error;
  }
};

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const chatRef = ref(database, `chats/${chatId}`);
    const snapshot = await get(chatRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as Chat;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching chat by ID:', error);
    throw error;
  }
};

export const createChat = async (userId: string, title: string): Promise<Chat> => {
  try {
    const chatsRef = ref(database, 'chats');
    const newChatRef = push(chatsRef);
    
    const newChat: Chat = {
      id: newChatRef.key || `chat-${Date.now()}`,
      title,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `welcome-${Date.now()}`,
          content: 'Hello! How can I help you today?',
          role: 'assistant',
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    await set(newChatRef, newChat);
    
    return newChat;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
  try {
    const chatRef = ref(database, `chats/${chatId}`);
    const snapshot = await get(chatRef);
    
    if (snapshot.exists()) {
      const chat = snapshot.val() as Chat;
      return chat.messages || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
};

export const sendMessage = async (chatId: string, content: string, role: 'user' | 'assistant' = 'user'): Promise<ChatMessage> => {
  try {
    const chatRef = ref(database, `chats/${chatId}`);
    const snapshot = await get(chatRef);
    
    if (!snapshot.exists()) {
      throw new Error('Chat not found');
    }
    
    const chat = snapshot.val() as Chat;
    
    const newMessage: ChatMessage = {
      id: `message-${Date.now()}`,
      content,
      role,
      timestamp: new Date().toISOString()
    };
    
    if (!chat.messages) {
      chat.messages = [];
    }
    
    chat.messages.push(newMessage);
    chat.updatedAt = newMessage.timestamp;
    
    await update(chatRef, {
      messages: chat.messages,
      updatedAt: chat.updatedAt
    });
    
    return newMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const addMessageToChat = async (chatId: string, message: { content: string, role: 'user' | 'assistant' }): Promise<ChatMessage> => {
  return sendMessage(chatId, message.content, message.role);
};

export const clearUserChatHistory = async (userId: string) => {
  try {
    const chatsRef = ref(database, 'chats');
    const userChatsQuery = query(chatsRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(userChatsQuery);
    
    if (snapshot.exists()) {
      const chats = snapshot.val();
      const promises = Object.keys(chats).map(key => remove(ref(database, `chats/${key}`)));
      await Promise.all(promises);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error clearing user chat history:', error);
    throw error;
  }
};

// The following functions are kept for compatibility but work directly with Firebase now
export const login = async (credentials: { email: string; password: string }) => {
  console.error('login function should not be called directly, use Firebase auth');
  throw new Error('Use Firebase auth directly');
};

export const register = async (userData: { email: string; password: string; username: string }) => {
  console.error('register function should not be called directly, use Firebase auth');
  throw new Error('Use Firebase auth directly');
};

export const activateLicense = async (licenseKey: string) => {
  console.error('activateLicense function should not be called directly');
  throw new Error('Use Firebase database directly');
};

export const requestLicense = async (message: string) => {
  console.error('requestLicense function should not be called directly');
  throw new Error('Use createLicenseRequest instead');
};

export const forgotPassword = async (email: string) => {
  console.error('forgotPassword function should not be called directly');
  throw new Error('Use Firebase auth directly');
};

export const resetPassword = async (token: string, newPassword: string) => {
  console.error('resetPassword function should not be called directly');
  throw new Error('Use Firebase auth directly');
};

export const createChatMessage = async (chatId: string, message: string) => {
  return sendMessage(chatId, message, 'user');
};
