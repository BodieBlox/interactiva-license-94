
import { User, LoginLog, ChatMessage, Chat, LicenseRequest, DashboardCustomization, License } from './types';

// Mock data for development
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    licenseActive: true,
    licenseKey: 'ADMIN-1234-5678-9ABC',
    customization: {
      primaryColor: '#7E69AB',
      companyName: 'Admin Corp',
      approved: true
    }
  },
  {
    id: '2',
    username: 'user',
    email: 'user@example.com',
    role: 'user',
    status: 'active',
    licenseActive: true,
    licenseKey: 'USER-1234-5678-9ABC'
  },
  {
    id: '3',
    username: 'warned',
    email: 'warned@example.com',
    role: 'user',
    status: 'warned',
    licenseActive: true,
    licenseKey: 'WARN-1234-5678-9ABC',
    warningMessage: 'Your account has been flagged for unusual activity.'
  },
  {
    id: '4',
    username: 'suspended',
    email: 'suspended@example.com',
    role: 'user',
    status: 'suspended',
    licenseActive: false,
    warningMessage: 'Your account has been suspended due to violation of terms.'
  }
];

const mockLoginLogs: LoginLog[] = [
  {
    id: '1',
    userId: '1',
    ip: '192.168.1.1',
    userAgent: 'Chrome/90.0.4430.93',
    timestamp: new Date().toISOString()
  },
  {
    id: '2',
    userId: '2',
    ip: '192.168.1.2',
    userAgent: 'Firefox/88.0',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockLicenses: License[] = [
  {
    id: '1',
    key: 'FREE-1234-5678-9ABC',
    isActive: true,
    status: 'active',
    type: 'standard',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    key: 'PREM-ABCD-EFGH-IJKL',
    isActive: true,
    status: 'active',
    type: 'premium',
    expiresAt: null,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    key: 'ENTP-MNOP-QRST-UVWX',
    isActive: false,
    status: 'revoked',
    type: 'enterprise',
    expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockLicenseRequests: LicenseRequest[] = [
  {
    id: '1',
    userId: '2',
    username: 'user',
    email: 'user@example.com',
    status: 'pending',
    message: 'I need access to premium features for my work.',
    createdAt: new Date().toISOString()
  }
];

const mockChats: Chat[] = [
  {
    id: '1',
    title: 'Getting Started',
    userId: '1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: '1',
        content: 'Hello! How can I help you today?',
        role: 'assistant',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        content: 'I need help getting started with the system.',
        role: 'user',
        timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        content: 'I\'d be happy to help you get started! What specific aspects of the system would you like to know more about?',
        role: 'assistant',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: '2',
    title: 'Technical Support',
    userId: '1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: '1',
        content: 'How can I assist you with technical issues?',
        role: 'assistant',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        content: 'I\'m having trouble connecting to the database.',
        role: 'user',
        timestamp: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        content: 'Let me help you troubleshoot that. What error message are you seeing?',
        role: 'assistant',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

// Mock API function that simulates API response delays
const mockApiResponse = <T>(data: T, delay: number = 500): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

// API Functions using mock data instead of real API calls
export const login = async (credentials: { email: string; password: string }) => {
  console.log('Mock login with:', credentials);
  
  const user = mockUsers.find(u => u.email === credentials.email);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Simple validation - in a real app this would be handled by auth service
  if (credentials.password !== 'password') {
    throw new Error('Invalid password');
  }
  
  return mockApiResponse({ user });
};

export const register = async (userData: { email: string; password: string; username: string }) => {
  console.log('Mock register:', userData);
  
  const existingUser = mockUsers.find(u => u.email === userData.email);
  
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  const newUser: User = {
    id: `user-${Date.now()}`,
    username: userData.username,
    email: userData.email,
    role: 'user',
    status: 'active',
    licenseActive: false
  };
  
  mockUsers.push(newUser);
  
  return mockApiResponse({ user: newUser });
};

export const activateLicense = async (licenseKey: string) => {
  console.log('Mock license activation:', licenseKey);
  
  const license = mockLicenses.find(l => l.key === licenseKey);
  
  if (!license) {
    throw new Error('License not found');
  }
  
  if (!license.isActive) {
    throw new Error('License is inactive');
  }
  
  return mockApiResponse({ success: true, licenseKey });
};

export const requestLicense = async (message: string) => {
  console.log('Mock license request:', message);
  return mockApiResponse({ success: true, message: 'License request submitted' });
};

export const forgotPassword = async (email: string) => {
  console.log('Mock forgot password:', email);
  return mockApiResponse({ success: true, message: 'Password reset email sent' });
};

export const resetPassword = async (token: string, newPassword: string) => {
  console.log('Mock reset password with token:', token);
  return mockApiResponse({ success: true, message: 'Password reset successful' });
};

export const getUsers = async (): Promise<User[]> => {
  console.log('Mock get users');
  return mockApiResponse(mockUsers);
};

export const getAllUsers = async (): Promise<User[]> => {
  console.log('Mock get all users');
  return mockApiResponse(mockUsers);
};

export const createUser = async (userData: { email: string, password?: string, username?: string, role?: string }) => {
  console.log('Mock create user:', userData);
  
  const newUser: User = {
    id: `user-${Date.now()}`,
    username: userData.username || userData.email.split('@')[0],
    email: userData.email,
    role: (userData.role as 'user' | 'admin') || 'user',
    status: 'active',
    licenseActive: false
  };
  
  mockUsers.push(newUser);
  
  return mockApiResponse(newUser);
};

export const updateUser = async (id: string, userData: any) => {
  console.log('Mock update user:', id, userData);
  
  const userIndex = mockUsers.findIndex(user => user.id === id);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData };
  
  return mockApiResponse(mockUsers[userIndex]);
};

export const deleteUser = async (id: string) => {
  console.log('Mock delete user:', id);
  
  const userIndex = mockUsers.findIndex(user => user.id === id);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  const deletedUser = mockUsers.splice(userIndex, 1)[0];
  
  return mockApiResponse(deletedUser);
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  console.log('Mock get user by email:', email);
  
  const user = mockUsers.find(user => user.email === email);
  
  return mockApiResponse(user || null);
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
  console.log('Mock approve dashboard customization:', userId);
  
  const userIndex = mockUsers.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  if (mockUsers[userIndex].customization) {
    mockUsers[userIndex].customization.approved = true;
  }
  
  return mockApiResponse(mockUsers[userIndex]);
};

export const generateLicense = async () => {
  console.log('Mock generate license');
  
  const newLicense: License = {
    id: `license-${Date.now()}`,
    key: `KEY-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`,
    isActive: true,
    status: 'active',
    type: 'standard',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  mockLicenses.push(newLicense);
  
  return mockApiResponse(newLicense);
};

export const createLicense = async () => {
  return generateLicense();
};

export const suspendLicense = async (licenseId: string) => {
  console.log('Mock suspend license:', licenseId);
  
  const licenseIndex = mockLicenses.findIndex(license => license.id === licenseId);
  
  if (licenseIndex === -1) {
    throw new Error('License not found');
  }
  
  mockLicenses[licenseIndex].isActive = false;
  mockLicenses[licenseIndex].status = 'inactive';
  mockLicenses[licenseIndex].suspendedAt = new Date().toISOString();
  
  return mockApiResponse(mockLicenses[licenseIndex]);
};

export const revokeLicense = async (licenseId: string) => {
  console.log('Mock revoke license:', licenseId);
  
  const licenseIndex = mockLicenses.findIndex(license => license.id === licenseId);
  
  if (licenseIndex === -1) {
    throw new Error('License not found');
  }
  
  mockLicenses[licenseIndex].isActive = false;
  mockLicenses[licenseIndex].status = 'revoked';
  
  return mockApiResponse(mockLicenses[licenseIndex]);
};

export const getLoginLogs = async (): Promise<LoginLog[]> => {
  console.log('Mock get login logs');
  return mockApiResponse(mockLoginLogs);
};

export const logUserLogin = async (userId: string, info: any) => {
  console.log('Mock log user login:', userId, info);
  
  const newLog: LoginLog = {
    id: `log-${Date.now()}`,
    userId,
    ip: info.ip || '0.0.0.0',
    userAgent: info.userAgent || 'Unknown',
    timestamp: new Date().toISOString()
  };
  
  mockLoginLogs.push(newLog);
  
  return mockApiResponse(newLog);
};

export const forceUserLogout = async (userId: string) => {
  console.log('Mock force user logout:', userId);
  
  const userIndex = mockUsers.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  mockUsers[userIndex].forcedLogout = new Date().toISOString();
  
  return mockApiResponse({ success: true });
};

export const getLicenseRequests = async (): Promise<LicenseRequest[]> => {
  console.log('Mock get license requests');
  return mockApiResponse(mockLicenseRequests);
};

export const createLicenseRequest = async (userId: string, message?: string) => {
  console.log('Mock create license request:', userId, message);
  
  const user = mockUsers.find(user => user.id === userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const newRequest: LicenseRequest = {
    id: `request-${Date.now()}`,
    userId,
    username: user.username,
    email: user.email,
    status: 'pending',
    message,
    createdAt: new Date().toISOString()
  };
  
  mockLicenseRequests.push(newRequest);
  
  return mockApiResponse(newRequest);
};

export const approveLicenseRequest = async (requestId: string) => {
  console.log('Mock approve license request:', requestId);
  
  const requestIndex = mockLicenseRequests.findIndex(request => request.id === requestId);
  
  if (requestIndex === -1) {
    throw new Error('License request not found');
  }
  
  mockLicenseRequests[requestIndex].status = 'approved';
  mockLicenseRequests[requestIndex].resolvedAt = new Date().toISOString();
  
  return mockApiResponse(mockLicenseRequests[requestIndex]);
};

export const rejectLicenseRequest = async (requestId: string) => {
  console.log('Mock reject license request:', requestId);
  
  const requestIndex = mockLicenseRequests.findIndex(request => request.id === requestId);
  
  if (requestIndex === -1) {
    throw new Error('License request not found');
  }
  
  mockLicenseRequests[requestIndex].status = 'rejected';
  mockLicenseRequests[requestIndex].resolvedAt = new Date().toISOString();
  
  return mockApiResponse(mockLicenseRequests[requestIndex]);
};

export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
  console.log('Mock get chat messages:', chatId);
  
  const chat = mockChats.find(chat => chat.id === chatId);
  
  if (!chat) {
    throw new Error('Chat not found');
  }
  
  return mockApiResponse(chat.messages || []);
};

export const createChatMessage = async (chatId: string, message: string) => {
  console.log('Mock create chat message:', chatId, message);
  
  const chatIndex = mockChats.findIndex(chat => chat.id === chatId);
  
  if (chatIndex === -1) {
    throw new Error('Chat not found');
  }
  
  const newMessage: ChatMessage = {
    id: `message-${Date.now()}`,
    content: message,
    role: 'user',
    timestamp: new Date().toISOString()
  };
  
  if (!mockChats[chatIndex].messages) {
    mockChats[chatIndex].messages = [];
  }
  
  mockChats[chatIndex].messages.push(newMessage);
  mockChats[chatIndex].updatedAt = newMessage.timestamp;
  
  return mockApiResponse(newMessage);
};

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  console.log('Mock get chat by id:', chatId);
  
  const chat = mockChats.find(chat => chat.id === chatId);
  
  return mockApiResponse(chat || null);
};

export const getUserChats = async (userId: string): Promise<Chat[]> => {
  console.log('Mock get user chats:', userId);
  
  const userChats = mockChats.filter(chat => chat.userId === userId);
  
  return mockApiResponse(userChats);
};

export const getAllChats = async (): Promise<Chat[]> => {
  console.log('Mock get all chats');
  return mockApiResponse(mockChats);
};

export const createChat = async (userId: string, title: string): Promise<Chat> => {
  console.log('Mock create chat:', userId, title);
  
  const newChat: Chat = {
    id: `chat-${Date.now()}`,
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
  
  mockChats.push(newChat);
  
  return mockApiResponse(newChat);
};

export const sendMessage = async (chatId: string, content: string, role: 'user' | 'assistant' = 'user'): Promise<ChatMessage> => {
  console.log('Mock send message:', chatId, content, role);
  
  const chatIndex = mockChats.findIndex(chat => chat.id === chatId);
  
  if (chatIndex === -1) {
    throw new Error('Chat not found');
  }
  
  const newMessage: ChatMessage = {
    id: `message-${Date.now()}`,
    content,
    role,
    timestamp: new Date().toISOString()
  };
  
  if (!mockChats[chatIndex].messages) {
    mockChats[chatIndex].messages = [];
  }
  
  mockChats[chatIndex].messages.push(newMessage);
  mockChats[chatIndex].updatedAt = newMessage.timestamp;
  
  return mockApiResponse(newMessage);
};

export const addMessageToChat = async (chatId: string, message: { content: string, role: 'user' | 'assistant' }): Promise<ChatMessage> => {
  return sendMessage(chatId, message.content, message.role);
};

export const clearUserChatHistory = async (userId: string) => {
  console.log('Mock clear user chat history:', userId);
  
  const userChatsIndexes = mockChats
    .map((chat, index) => chat.userId === userId ? index : -1)
    .filter(index => index !== -1);
  
  // Remove from the end to preserve indexes
  for (let i = userChatsIndexes.length - 1; i >= 0; i--) {
    mockChats.splice(userChatsIndexes[i], 1);
  }
  
  return mockApiResponse({ success: true });
};

export const getAllLicenses = async (): Promise<License[]> => {
  console.log('Mock get all licenses');
  return mockApiResponse(mockLicenses);
};

export const deleteLicense = async (licenseId: string) => {
  console.log(`License ${licenseId} deleted`);
  
  const licenseIndex = mockLicenses.findIndex(license => license.id === licenseId);
  
  if (licenseIndex === -1) {
    throw new Error('License not found');
  }
  
  mockLicenses.splice(licenseIndex, 1);
  
  return mockApiResponse({ success: true });
};

export const assignLicenseToUser = async (userId: string, licenseKey: string) => {
  console.log(`License ${licenseKey} assigned to user ${userId}`);
  
  const userIndex = mockUsers.findIndex(user => user.id === userId);
  const licenseIndex = mockLicenses.findIndex(license => license.key === licenseKey);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  if (licenseIndex === -1) {
    throw new Error('License not found');
  }
  
  mockUsers[userIndex].licenseActive = true;
  mockUsers[userIndex].licenseKey = licenseKey;
  
  return mockApiResponse({ success: true });
};
