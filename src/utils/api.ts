import { User, LoginLog, ChatMessage } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// Function to handle API requests
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

// Authentication
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

// User Management
export const getUsers = async (): Promise<User[]> => {
  return apiRequest('/users');
};

export const getAllUsers = async (): Promise<User[]> => {
  return apiRequest('/users/all');
};

export const createUser = async (userData: any) => {
  return apiRequest('/users', 'POST', userData);
};

export const updateUser = async (id: string, userData: any) => {
  return apiRequest(`/users/${id}`, 'PUT', userData);
};

export const deleteUser = async (id: string) => {
  return apiRequest(`/users/${id}`, 'DELETE');
};

// License Management
export const generateLicense = async () => {
  return apiRequest('/licenses/generate', 'POST');
};

// Login Logs
export const getLoginLogs = async (): Promise<LoginLog[]> => {
  return apiRequest('/login-logs');
};

export const forceUserLogout = async (userId: string) => {
    return apiRequest(`/login-logs/logout/${userId}`, 'POST');
};

// Chat Messages
export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
  return apiRequest(`/chat/${chatId}`);
};

export const createChatMessage = async (chatId: string, message: string) => {
  return apiRequest(`/chat/${chatId}`, 'POST', { message });
};

// Add these new functions to support license management
export const getAllLicenses = async () => {
  // This would normally make an API request to get all licenses
  // For demo purposes, returning mock data
  return [
    {
      id: '1',
      key: 'FREE-1234-5678-9ABC',
      status: 'active',
      type: 'standard',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      key: 'PREM-ABCD-EFGH-IJKL',
      status: 'active',
      type: 'premium',
      expiresAt: null,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      key: 'ENTP-MNOP-QRST-UVWX',
      status: 'revoked',
      type: 'enterprise',
      expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
};

export const deleteLicense = async (licenseId: string) => {
  // This would normally make an API request to delete a license
  // For demo purposes, just returning success
  console.log(`License ${licenseId} deleted`);
  return { success: true };
};

export const assignLicenseToUser = async (userId: string, licenseKey: string) => {
  // This would normally make an API request to assign a license to a user
  // For demo purposes, just returning success
  console.log(`License ${licenseKey} assigned to user ${userId}`);
  return { success: true };
};
