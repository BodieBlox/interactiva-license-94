import { get, ref, set, push, update, remove, query, orderByChild, equalTo } from "firebase/database";
import { database, auth } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Chat, ChatMessage, User, License, LoginLog, LicenseRequest, DashboardCustomization } from "./types";

// User API functions
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);
  
  if (snapshot.exists()) {
    const users = snapshot.val();
    const userArray = Object.values(users) as User[];
    const user = userArray.find(u => u.email === email);
    return user || null;
  }
  
  return null;
};

export const getUsers = async (): Promise<User[]> => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);
  
  if (snapshot.exists()) {
    const users = snapshot.val();
    return Object.values(users) as User[];
  }
  
  return [];
};

// Aliasing getAllUsers as getUsers for compatibility
export const getAllUsers = getUsers;

export const updateUserStatus = async (userId: string, status: 'active' | 'warned' | 'suspended', warningMessage?: string): Promise<User> => {
  const userRef = ref(database, `users/${userId}`);
  const userSnapshot = await get(userRef);
  
  if (!userSnapshot.exists()) {
    throw new Error('User not found');
  }
  
  const user = userSnapshot.val() as User;
  const updates: {status: 'active' | 'warned' | 'suspended', warningMessage?: string} = { status };
  
  if (warningMessage) {
    updates.warningMessage = warningMessage;
  }
  
  await update(userRef, updates);
  
  // Return the updated user
  return { ...user, ...updates };
};

// User settings functions
export const updateUsername = async (userId: string, username: string): Promise<User> => {
  const userRef = ref(database, `users/${userId}`);
  const userSnapshot = await get(userRef);
  
  if (!userSnapshot.exists()) {
    throw new Error('User not found');
  }
  
  const user = userSnapshot.val() as User;
  await update(userRef, { username });
  
  return { ...user, username };
};

export const updateDashboardCustomization = async (userId: string, customization: DashboardCustomization): Promise<User> => {
  const userRef = ref(database, `users/${userId}`);
  const userSnapshot = await get(userRef);
  
  if (!userSnapshot.exists()) {
    throw new Error('User not found');
  }
  
  const user = userSnapshot.val() as User;
  
  // If not approved yet, set to false by default
  if (customization.approved === undefined) {
    customization.approved = false;
  }
  
  await update(userRef, { customization });
  
  return { ...user, customization };
};

export const approveDashboardCustomization = async (userId: string): Promise<User> => {
  const userRef = ref(database, `users/${userId}`);
  const userSnapshot = await get(userRef);
  
  if (!userSnapshot.exists()) {
    throw new Error('User not found');
  }
  
  const user = userSnapshot.val() as User;
  
  if (!user.customization) {
    throw new Error('User has no customization settings');
  }
  
  const updatedCustomization = {
    ...user.customization,
    approved: true
  };
  
  await update(userRef, { 
    customization: updatedCustomization 
  });
  
  return { 
    ...user, 
    customization: updatedCustomization 
  };
};

// Chat API functions
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  const chatsRef = ref(database, 'chats');
  const snapshot = await get(chatsRef);
  
  if (snapshot.exists()) {
    const chats = snapshot.val();
    const chatArray = Object.values(chats) as Chat[];
    return chatArray.filter(chat => chat.userId === userId);
  }
  
  return [];
};

export const getAllChats = async (): Promise<Chat[]> => {
  const chatsRef = ref(database, 'chats');
  const snapshot = await get(chatsRef);
  
  if (snapshot.exists()) {
    const chats = snapshot.val();
    return Object.values(chats) as Chat[];
  }
  
  return [];
};

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  const chatRef = ref(database, `chats/${chatId}`);
  const snapshot = await get(chatRef);
  
  if (snapshot.exists()) {
    return snapshot.val() as Chat;
  }
  
  return null;
};

export const createChat = async (userId: string, title: string): Promise<Chat> => {
  const chatsRef = ref(database, 'chats');
  const newChatRef = push(chatsRef);
  const chatId = newChatRef.key as string;
  
  const now = new Date().toISOString();
  
  const newChat: Chat = {
    id: chatId,
    title,
    userId,
    createdAt: now,
    updatedAt: now,
    messages: []
  };
  
  await set(newChatRef, newChat);
  return newChat;
};

export const sendMessage = async (chatId: string, content: string): Promise<ChatMessage> => {
  const now = new Date().toISOString();
  const message: Omit<ChatMessage, 'id'> = {
    content,
    role: 'user',
    timestamp: now
  };
  
  return addMessageToChat(chatId, message);
};

export const addMessageToChat = async (chatId: string, message: Omit<ChatMessage, 'id'>): Promise<ChatMessage> => {
  const chatRef = ref(database, `chats/${chatId}`);
  const chatSnapshot = await get(chatRef);
  
  if (!chatSnapshot.exists()) {
    throw new Error('Chat not found');
  }
  
  const chat = chatSnapshot.val() as Chat;
  const messageId = `msg_${Date.now()}`;
  
  const newMessage: ChatMessage = {
    ...message,
    id: messageId
  };
  
  const updatedMessages = [...(chat.messages || []), newMessage];
  
  await update(chatRef, {
    messages: updatedMessages,
    updatedAt: new Date().toISOString()
  });
  
  return newMessage;
};

// License API functions
export const getLicenses = async (): Promise<License[]> => {
  return getAllLicenses();
};

export const getAllLicenses = async (): Promise<License[]> => {
  const licensesRef = ref(database, 'licenses');
  const snapshot = await get(licensesRef);
  
  if (snapshot.exists()) {
    const licenses = snapshot.val();
    return Object.values(licenses) as License[];
  }
  
  return [];
};

export const generateLicense = async (): Promise<License> => {
  return createLicense();
};

export const createLicense = async (): Promise<License> => {
  const licenseKey = generateLicenseKey();
  
  const licenseRef = ref(database, `licenses/${licenseKey}`);
  
  const newLicense: License = {
    id: licenseKey,
    key: licenseKey,
    isActive: false,
    createdAt: new Date().toISOString()
  };
  
  await set(licenseRef, newLicense);
  return newLicense;
};

export const createLicenseWithExpiry = async (expiresAt?: string): Promise<License> => {
  const licenseKey = generateLicenseKey();
  
  const licenseRef = ref(database, `licenses/${licenseKey}`);
  
  const newLicense: License = {
    id: licenseKey,
    key: licenseKey,
    isActive: false,
    createdAt: new Date().toISOString(),
    expiresAt
  };
  
  await set(licenseRef, newLicense);
  return newLicense;
};

export const deleteLicense = async (licenseId: string): Promise<void> => {
  const licenseRef = ref(database, `licenses/${licenseId}`);
  const licenseSnapshot = await get(licenseRef);
  
  if (!licenseSnapshot.exists()) {
    throw new Error('License not found');
  }
  
  const license = licenseSnapshot.val() as License;
  
  if (license.userId) {
    const userRef = ref(database, `users/${license.userId}`);
    await update(userRef, {
      licenseActive: false,
      licenseKey: null
    });
  }
  
  await remove(licenseRef);
};

// New functions for license management
export const suspendLicense = async (licenseId: string): Promise<License> => {
  const licenseRef = ref(database, `licenses/${licenseId}`);
  const licenseSnapshot = await get(licenseRef);
  
  if (!licenseSnapshot.exists()) {
    throw new Error('License not found');
  }
  
  const license = licenseSnapshot.val() as License;
  
  if (!license.userId) {
    throw new Error('License is not activated');
  }
  
  await update(licenseRef, {
    isActive: false,
    suspendedAt: new Date().toISOString()
  });
  
  const userRef = ref(database, `users/${license.userId}`);
  await update(userRef, {
    licenseActive: false
  });
  
  return {
    ...license,
    isActive: false,
    suspendedAt: new Date().toISOString()
  };
};

export const revokeLicense = async (licenseId: string): Promise<void> => {
  const licenseRef = ref(database, `licenses/${licenseId}`);
  const licenseSnapshot = await get(licenseRef);
  
  if (!licenseSnapshot.exists()) {
    throw new Error('License not found');
  }
  
  const license = licenseSnapshot.val() as License;
  
  if (license.userId) {
    const userRef = ref(database, `users/${license.userId}`);
    await update(userRef, {
      licenseActive: false,
      licenseKey: null
    });
    
    await update(licenseRef, {
      isActive: false,
      userId: null,
      activatedAt: null,
      suspendedAt: null
    });
  }
};

export const clearUserChatHistory = async (userId: string): Promise<void> => {
  const chatsRef = ref(database, 'chats');
  const snapshot = await get(chatsRef);
  
  if (snapshot.exists()) {
    const chats = snapshot.val();
    const promises: Promise<void>[] = [];
    
    Object.entries(chats).forEach(([chatId, chat]) => {
      if ((chat as Chat).userId === userId) {
        const chatRef = ref(database, `chats/${chatId}`);
        promises.push(remove(chatRef));
      }
    });
    
    await Promise.all(promises);
  }
};

export const deleteChat = async (chatId: string): Promise<void> => {
  const chatRef = ref(database, `chats/${chatId}`);
  await remove(chatRef);
};

// New user session management functions
export const logUserLogin = async (userId: string, ip: string, userAgent: string): Promise<LoginLog> => {
  const logsRef = ref(database, 'loginLogs');
  const newLogRef = push(logsRef);
  const logId = newLogRef.key as string;
  
  const now = new Date().toISOString();
  
  const newLog: LoginLog = {
    id: logId,
    userId,
    ip,
    userAgent,
    timestamp: now
  };
  
  await set(newLogRef, newLog);
  
  const userRef = ref(database, `users/${userId}`);
  await update(userRef, {
    lastLogin: newLog
  });
  
  return newLog;
};

export const getLoginLogs = async (): Promise<LoginLog[]> => {
  const logsRef = ref(database, 'loginLogs');
  const snapshot = await get(logsRef);
  
  if (snapshot.exists()) {
    const logs = snapshot.val();
    return Object.values(logs) as LoginLog[];
  }
  
  return [];
};

export const getUserLoginLogs = async (userId: string): Promise<LoginLog[]> => {
  const logsRef = ref(database, 'loginLogs');
  const userLogsQuery = query(logsRef, orderByChild('userId'), equalTo(userId));
  const snapshot = await get(userLogsQuery);
  
  if (snapshot.exists()) {
    const logs = snapshot.val();
    return Object.values(logs) as LoginLog[];
  }
  
  return [];
};

export const forceUserLogout = async (userId: string): Promise<void> => {
  const userRef = ref(database, `users/${userId}`);
  await update(userRef, {
    forcedLogout: new Date().toISOString()
  });
};

// License request functions
export const createLicenseRequest = async (userId: string, message?: string): Promise<LicenseRequest> => {
  const userRef = ref(database, `users/${userId}`);
  const userSnapshot = await get(userRef);
  
  if (!userSnapshot.exists()) {
    throw new Error('User not found');
  }
  
  const user = userSnapshot.val() as User;
  
  const requestsRef = ref(database, 'licenseRequests');
  const newRequestRef = push(requestsRef);
  const requestId = newRequestRef.key as string;
  
  const now = new Date().toISOString();
  
  const newRequest: LicenseRequest = {
    id: requestId,
    userId,
    username: user.username,
    email: user.email,
    status: 'pending',
    message,
    createdAt: now
  };
  
  await set(newRequestRef, newRequest);
  return newRequest;
};

export const getLicenseRequests = async (): Promise<LicenseRequest[]> => {
  const requestsRef = ref(database, 'licenseRequests');
  const snapshot = await get(requestsRef);
  
  if (snapshot.exists()) {
    const requests = snapshot.val();
    return Object.values(requests) as LicenseRequest[];
  }
  
  return [];
};

export const approveLicenseRequest = async (requestId: string): Promise<void> => {
  const requestRef = ref(database, `licenseRequests/${requestId}`);
  const requestSnapshot = await get(requestRef);
  
  if (!requestSnapshot.exists()) {
    throw new Error('License request not found');
  }
  
  const request = requestSnapshot.val() as LicenseRequest;
  
  if (request.status !== 'pending') {
    throw new Error('License request has already been processed');
  }
  
  const newLicense = await createLicense();
  
  const licenseRef = ref(database, `licenses/${newLicense.id}`);
  await update(licenseRef, {
    isActive: true,
    userId: request.userId,
    activatedAt: new Date().toISOString()
  });
  
  const userRef = ref(database, `users/${request.userId}`);
  await update(userRef, {
    licenseActive: true,
    licenseKey: newLicense.key
  });
  
  await update(requestRef, {
    status: 'approved',
    resolvedAt: new Date().toISOString()
  });
};

export const rejectLicenseRequest = async (requestId: string): Promise<void> => {
  const requestRef = ref(database, `licenseRequests/${requestId}`);
  const requestSnapshot = await get(requestRef);
  
  if (!requestSnapshot.exists()) {
    throw new Error('License request not found');
  }
  
  const request = requestSnapshot.val() as LicenseRequest;
  
  if (request.status !== 'pending') {
    throw new Error('License request has already been processed');
  }
  
  await update(requestRef, {
    status: 'rejected',
    resolvedAt: new Date().toISOString()
  });
};

// User creation function
export const createUser = async (email: string, password: string, username: string, role: 'user' | 'admin' = 'user'): Promise<User> => {
  // Fix the incorrect auth usage
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  const newUser: User = {
    id: firebaseUser.uid,
    username,
    email,
    role,
    status: 'active',
    licenseActive: false
  };
  
  await set(ref(database, `users/${firebaseUser.uid}`), newUser);
  return newUser;
};

// Helpers
const generateLicenseKey = (): string => {
  const segments = [
    Math.random().toString(36).substring(2, 6).toUpperCase(),
    Math.random().toString(36).substring(2, 6).toUpperCase(),
    Math.random().toString(36).substring(2, 6).toUpperCase(),
    Math.random().toString(36).substring(2, 6).toUpperCase()
  ];
  
  return segments.join('-');
};

// Add the missing assignLicenseToUser function
export const assignLicenseToUser = async (userId: string, licenseKey: string): Promise<User> => {
  const userRef = ref(database, `users/${userId}`);
  const userSnapshot = await get(userRef);
  
  if (!userSnapshot.exists()) {
    throw new Error('User not found');
  }
  
  const user = userSnapshot.val() as User;
  
  // Update the user's license information
  await update(userRef, {
    licenseActive: true,
    licenseKey: licenseKey
  });
  
  // Activate the license in the licenses collection
  const licensesRef = ref(database, 'licenses');
  const licensesSnapshot = await get(licensesRef);
  
  if (licensesSnapshot.exists()) {
    const licenses = licensesSnapshot.val();
    const licenseEntries = Object.entries(licenses);
    
    for (const [licenseId, license] of licenseEntries) {
      if ((license as License).key === licenseKey) {
        const licenseRef = ref(database, `licenses/${licenseId}`);
        await update(licenseRef, {
          isActive: true,
          userId: userId,
          activatedAt: new Date().toISOString()
        });
        break;
      }
    }
  }
  
  return {
    ...user,
    licenseActive: true,
    licenseKey: licenseKey
  };
};
