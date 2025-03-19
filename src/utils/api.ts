import { User, LoginLog, ChatMessage, Chat, LicenseRequest, DashboardCustomization } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

const apiRequest = async (url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}) => {
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(API_BASE_URL + url, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const login = async (credentials: any) => {
  return apiRequest('/auth/login', 'POST', credentials);
};

export const register = async (userData: any) => {
  return apiRequest('/auth/register', 'POST', userData);
};

export const activateLicense = async (licenseKey: string) => {
  return apiRequest('/auth/activate', 'POST', { licenseKey });
};

export const requestLicense = async (message: string) => {
  return apiRequest('/auth/request-license', 'POST', { message });
};

export const forgotPassword = async (email: string) => {
  return apiRequest('/auth/forgot-password', 'POST', { email });
};

export const resetPassword = async (token: string, newPassword: string) => {
  return apiRequest('/auth/reset-password', 'POST', { token, newPassword });
};

export const getUsers = async (): Promise<User[]> => {
  return apiRequest('/users');
};

export const getAllUsers = async (): Promise<User[]> => {
  return apiRequest('/users/all');
};

export const createUser = async (email: string, password?: string, username?: string, role?: string) => {
  return apiRequest('/users', 'POST', { email, password, username, role });
};

export const updateUser = async (id: string, userData: any) => {
  return apiRequest(`/users/${id}`, 'PUT', userData);
};

export const deleteUser = async (id: string) => {
  return apiRequest(`/users/${id}`, 'DELETE');
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  return apiRequest(`/users/email/${email}`);
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
  return apiRequest(`/users/${userId}/approve-branding`, 'POST');
};

export const generateLicense = async () => {
  return apiRequest('/licenses/generate', 'POST');
};

export const createLicense = async () => {
  return generateLicense();
};

export const suspendLicense = async (licenseId: string) => {
  return apiRequest(`/licenses/${licenseId}/suspend`, 'POST');
};

export const revokeLicense = async (licenseId: string) => {
  return apiRequest(`/licenses/${licenseId}/revoke`, 'POST');
};

export const getLoginLogs = async (): Promise<LoginLog[]> => {
  return apiRequest('/login-logs');
};

export const logUserLogin = async (userId: string, info: any) => {
  return apiRequest('/login-logs', 'POST', { userId, ...info });
};

export const forceUserLogout = async (userId: string) => {
  return apiRequest(`/login-logs/logout/${userId}`, 'POST');
};

export const getLicenseRequests = async (): Promise<LicenseRequest[]> => {
  return apiRequest('/license-requests');
};

export const createLicenseRequest = async (userId: string, message?: string) => {
  return apiRequest('/license-requests', 'POST', { userId, message });
};

export const approveLicenseRequest = async (requestId: string) => {
  return apiRequest(`/license-requests/${requestId}/approve`, 'POST');
};

export const rejectLicenseRequest = async (requestId: string) => {
  return apiRequest(`/license-requests/${requestId}/reject`, 'POST');
};

export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
  return apiRequest(`/chat/${chatId}`);
};

export const createChatMessage = async (chatId: string, message: string) => {
  return apiRequest(`/chat/${chatId}`, 'POST', { message });
};

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  return apiRequest(`/chats/${chatId}`);
};

export const getUserChats = async (userId: string): Promise<Chat[]> => {
  return apiRequest(`/users/${userId}/chats`);
};

export const getAllChats = async (): Promise<Chat[]> => {
  return apiRequest('/chats');
};

export const createChat = async (userId: string, title: string): Promise<Chat> => {
  return apiRequest('/chats', 'POST', { userId, title });
};

export const sendMessage = async (chatId: string, content: string, role: 'user' | 'assistant' = 'user'): Promise<ChatMessage> => {
  return apiRequest(`/chats/${chatId}/messages`, 'POST', { content, role });
};

export const addMessageToChat = async (chatId: string, message: { content: string, role: 'user' | 'assistant' }): Promise<ChatMessage> => {
  return sendMessage(chatId, message.content, message.role);
};

export const clearUserChatHistory = async (userId: string) => {
  return apiRequest(`/users/${userId}/chats`, 'DELETE');
};

export const getAllLicenses = async () => {
  return [
    {
      id: '1',
      key: 'FREE-1234-5678-9ABC',
      status: 'active' as const,
      type: 'standard',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      key: 'PREM-ABCD-EFGH-IJKL',
      status: 'active' as const,
      type: 'premium',
      expiresAt: null,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      key: 'ENTP-MNOP-QRST-UVWX',
      status: 'revoked' as const,
      type: 'enterprise',
      expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
};

export const deleteLicense = async (licenseId: string) => {
  console.log(`License ${licenseId} deleted`);
  return { success: true };
};

export const assignLicenseToUser = async (userId: string, licenseKey: string) => {
  console.log(`License ${licenseKey} assigned to user ${userId}`);
  return { success: true };
};
