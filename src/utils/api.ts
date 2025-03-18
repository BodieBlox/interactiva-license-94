
import { User, License, Chat, ChatMessage } from './types';

// Mock API for demo purposes
// In a real app, these would be actual API calls to your backend

// Mock database
const mockUsers: User[] = [
  {
    id: '1',
    username: 'user',
    email: 'user@example.com',
    role: 'user',
    status: 'active',
    licenseActive: false
  },
  {
    id: '2',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    licenseActive: true,
    licenseKey: 'ADMIN-1234-5678-9ABC'
  },
  {
    id: '3',
    username: 'warned_user',
    email: 'warned@example.com',
    role: 'user',
    status: 'warned',
    licenseActive: true,
    licenseKey: 'USER-WARN-5678-9ABC',
    warningMessage: 'This is a warning for inappropriate usage of the AI system.'
  },
  {
    id: '4',
    username: 'suspended_user',
    email: 'suspended@example.com',
    role: 'user',
    status: 'suspended',
    licenseActive: true,
    licenseKey: 'USER-SUSP-5678-9ABC',
    warningMessage: 'Your account has been suspended due to violation of our terms of service.'
  }
];

const mockLicenses: License[] = [
  {
    id: '1',
    key: 'ADMIN-1234-5678-9ABC',
    isActive: true,
    userId: '2',
    createdAt: '2023-01-01T00:00:00Z',
    activatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    key: 'USER-WARN-5678-9ABC',
    isActive: true,
    userId: '3',
    createdAt: '2023-01-02T00:00:00Z',
    activatedAt: '2023-01-02T00:00:00Z'
  },
  {
    id: '3',
    key: 'USER-SUSP-5678-9ABC',
    isActive: true,
    userId: '4',
    createdAt: '2023-01-03T00:00:00Z',
    activatedAt: '2023-01-03T00:00:00Z'
  },
  {
    id: '4',
    key: 'FREE-1234-5678-9ABC',
    isActive: false,
    createdAt: '2023-01-04T00:00:00Z'
  }
];

const mockChats: Chat[] = [
  {
    id: '1',
    title: 'Getting started with AI',
    userId: '1',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-01-15T00:10:00Z',
    messages: [
      {
        id: '1',
        content: 'Hello, I\'m new to this system. Can you help me?',
        role: 'user',
        timestamp: '2023-01-15T00:00:00Z'
      },
      {
        id: '2',
        content: 'Hello! Welcome to the AI system. I\'d be happy to help you get started. What would you like to know?',
        role: 'assistant',
        timestamp: '2023-01-15T00:00:30Z'
      }
    ]
  }
];

// Authentication methods
export const loginUser = async (email: string, password: string): Promise<User> => {
  // In a real app, this would verify credentials against your backend
  const user = mockUsers.find(u => u.email === email);
  
  if (!user) {
    return Promise.reject(new Error('Invalid email or password'));
  }
  
  // For demo, we're pretending that any password works
  return Promise.resolve(user);
};

export const activateLicense = async (userId: string, licenseKey: string): Promise<User> => {
  const license = mockLicenses.find(l => l.key === licenseKey && !l.isActive);
  
  if (!license) {
    return Promise.reject(new Error('Invalid or already activated license key'));
  }
  
  const user = mockUsers.find(u => u.id === userId);
  if (!user) {
    return Promise.reject(new Error('User not found'));
  }
  
  // Update license and user
  license.isActive = true;
  license.userId = userId;
  license.activatedAt = new Date().toISOString();
  
  user.licenseActive = true;
  user.licenseKey = licenseKey;
  
  return Promise.resolve(user);
};

// Admin API methods
export const getUsers = async (): Promise<User[]> => {
  return Promise.resolve(mockUsers);
};

export const updateUserStatus = async (userId: string, status: User['status'], warningMessage?: string): Promise<User> => {
  const user = mockUsers.find(u => u.id === userId);
  
  if (!user) {
    return Promise.reject(new Error('User not found'));
  }
  
  user.status = status;
  if (warningMessage) {
    user.warningMessage = warningMessage;
  }
  
  return Promise.resolve(user);
};

export const generateLicense = async (): Promise<License> => {
  // Generate a random license key
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) key += '-';
  }
  
  const newLicense: License = {
    id: (mockLicenses.length + 1).toString(),
    key,
    isActive: false,
    createdAt: new Date().toISOString()
  };
  
  mockLicenses.push(newLicense);
  
  return Promise.resolve(newLicense);
};

export const getLicenses = async (): Promise<License[]> => {
  return Promise.resolve(mockLicenses);
};

// Chat API methods
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  return Promise.resolve(mockChats.filter(c => c.userId === userId));
};

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  const chat = mockChats.find(c => c.id === chatId);
  return Promise.resolve(chat || null);
};

export const createChat = async (userId: string, title: string): Promise<Chat> => {
  const newChat: Chat = {
    id: (mockChats.length + 1).toString(),
    title,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  };
  
  mockChats.push(newChat);
  
  return Promise.resolve(newChat);
};

export const sendMessage = async (chatId: string, content: string): Promise<ChatMessage> => {
  const chat = mockChats.find(c => c.id === chatId);
  
  if (!chat) {
    return Promise.reject(new Error('Chat not found'));
  }
  
  const userMessage: ChatMessage = {
    id: (chat.messages.length + 1).toString(),
    content,
    role: 'user',
    timestamp: new Date().toISOString()
  };
  
  chat.messages.push(userMessage);
  chat.updatedAt = new Date().toISOString();
  
  // In a real app, this would make a call to OpenAI API
  setTimeout(() => {
    const aiResponse: ChatMessage = {
      id: (chat.messages.length + 1).toString(),
      content: `This is a simulated AI response to: "${content}"`,
      role: 'assistant',
      timestamp: new Date().toISOString()
    };
    chat.messages.push(aiResponse);
    chat.updatedAt = new Date().toISOString();
  }, 1000);
  
  return Promise.resolve(userMessage);
};
