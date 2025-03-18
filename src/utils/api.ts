
import { get, ref, set, push, update, remove } from "firebase/database";
import { database } from "./firebase";
import { Chat, ChatMessage, User, License } from "./types";

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

export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);
  
  if (snapshot.exists()) {
    const users = snapshot.val();
    return Object.values(users) as User[];
  }
  
  return [];
};

export const updateUserStatus = async (userId: string, status: 'active' | 'warned' | 'suspended', warningMessage?: string): Promise<void> => {
  const userRef = ref(database, `users/${userId}`);
  const updates: {status: string, warningMessage?: string} = { status };
  
  if (warningMessage) {
    updates.warningMessage = warningMessage;
  }
  
  await update(userRef, updates);
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
export const getAllLicenses = async (): Promise<License[]> => {
  const licensesRef = ref(database, 'licenses');
  const snapshot = await get(licensesRef);
  
  if (snapshot.exists()) {
    const licenses = snapshot.val();
    return Object.values(licenses) as License[];
  }
  
  return [];
};

export const createLicense = async (): Promise<License> => {
  const licensesRef = ref(database, 'licenses');
  const newLicenseRef = push(licensesRef);
  const licenseId = newLicenseRef.key as string;
  
  // Generate a random license key
  const licenseKey = generateLicenseKey();
  
  const newLicense: License = {
    id: licenseId,
    key: licenseKey,
    isActive: false,
    createdAt: new Date().toISOString()
  };
  
  await set(newLicenseRef, newLicense);
  return newLicense;
};

export const deleteLicense = async (licenseId: string): Promise<void> => {
  const licenseRef = ref(database, `licenses/${licenseId}`);
  await remove(licenseRef);
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
