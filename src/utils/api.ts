
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

// Add missing functions for user management
export const getUsers = async () => {
  try {
    const response = await fetch('https://orgid-f590b-default-rtdb.firebaseio.com/users.json');
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const data = await response.json();
    
    // Convert object to array
    const users = data ? Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    })) : [];
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getAllUsers = getUsers; // Alias for getUsers

export const createUser = async (userData: any) => {
  try {
    // Generate a user ID
    const userId = `user_${Date.now()}`;
    
    const newUser = {
      ...userData,
      id: userId,
      createdAt: new Date().toISOString(),
      role: userData.role || 'user',
      licenseActive: false,
      status: 'active'
    };
    
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/users/${userId}.json`, {
      method: 'PUT',
      body: JSON.stringify(newUser),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, userData: any) => {
  try {
    // First get the current user data
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/users/${userId}.json`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    const currentUserData = await response.json();
    
    // Merge the current data with the new data
    const updatedUser = {
      ...currentUserData,
      ...userData
    };
    
    // Update the user
    const updateResponse = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/users/${userId}.json`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
    
    if (!updateResponse.ok) {
      throw new Error('Failed to update user');
    }
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const updateUserStatus = async (userId: string, status: string, warningMessage = '') => {
  try {
    const userData = {
      status,
      ...(status === 'warned' && { warningMessage }),
    };
    
    return await updateUser(userId, userData);
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

export const updateUsername = async (userId: string, username: string) => {
  try {
    return await updateUser(userId, { username });
  } catch (error) {
    console.error('Error updating username:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const users = await getUsers();
    return users.find(user => user.email === email);
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

// Chat related functions
export const getUserChats = async (userId: string) => {
  try {
    const response = await fetch('https://orgid-f590b-default-rtdb.firebaseio.com/chats.json');
    
    if (!response.ok) {
      throw new Error('Failed to fetch chats');
    }
    
    const data = await response.json();
    
    // Filter chats by user ID and convert to array
    const chats = data ? Object.keys(data)
      .filter(key => data[key].userId === userId)
      .map(key => ({
        id: key,
        ...data[key]
      })) : [];
    
    return chats;
  } catch (error) {
    console.error('Error fetching user chats:', error);
    throw error;
  }
};

export const getAllChats = async () => {
  try {
    const response = await fetch('https://orgid-f590b-default-rtdb.firebaseio.com/chats.json');
    
    if (!response.ok) {
      throw new Error('Failed to fetch all chats');
    }
    
    const data = await response.json();
    
    // Convert object to array
    const chats = data ? Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    })) : [];
    
    return chats;
  } catch (error) {
    console.error('Error fetching all chats:', error);
    throw error;
  }
};

export const getChatById = async (chatId: string) => {
  try {
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/chats/${chatId}.json`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch chat');
    }
    
    const data = await response.json();
    
    if (!data) {
      return null;
    }
    
    // Convert messages object to array if it exists
    if (data.messages) {
      data.messages = Object.keys(data.messages).map(key => ({
        id: key,
        ...data.messages[key]
      }));
    } else {
      data.messages = [];
    }
    
    return {
      id: chatId,
      ...data
    };
  } catch (error) {
    console.error('Error fetching chat by ID:', error);
    throw error;
  }
};

export const createChat = async (userId: string, title = 'New conversation') => {
  try {
    const chatId = `chat_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const newChat = {
      userId,
      title,
      createdAt: timestamp,
      updatedAt: timestamp,
      messages: {}
    };
    
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/chats/${chatId}.json`, {
      method: 'PUT',
      body: JSON.stringify(newChat),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create chat');
    }
    
    return {
      id: chatId,
      ...newChat,
      messages: []
    };
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

export const addMessageToChat = async (chatId: string, message: any) => {
  try {
    const messageId = message.id || `msg_${Date.now()}`;
    const timestamp = message.timestamp || new Date().toISOString();
    
    const newMessage = {
      id: messageId,
      content: message.content,
      role: message.role,
      timestamp,
      ...(message.isAdminAction && { isAdminAction: message.isAdminAction }),
      ...(message.adminActionResult && { adminActionResult: message.adminActionResult })
    };
    
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/chats/${chatId}/messages/${messageId}.json`, {
      method: 'PUT',
      body: JSON.stringify(newMessage),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add message to chat');
    }
    
    // Update the chat's updatedAt timestamp
    await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/chats/${chatId}/updatedAt.json`, {
      method: 'PUT',
      body: JSON.stringify(timestamp),
    });
    
    return newMessage;
  } catch (error) {
    console.error('Error adding message to chat:', error);
    throw error;
  }
};

export const clearUserChatHistory = async (userId: string) => {
  try {
    const chats = await getUserChats(userId);
    
    // Delete each chat
    for (const chat of chats) {
      await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/chats/${chat.id}.json`, {
        method: 'DELETE'
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing user chat history:', error);
    throw error;
  }
};

// Login logs functions
export const getLoginLogs = async () => {
  try {
    const response = await fetch('https://orgid-f590b-default-rtdb.firebaseio.com/loginLogs.json');
    
    if (!response.ok) {
      throw new Error('Failed to fetch login logs');
    }
    
    const data = await response.json();
    
    // Convert object to array
    const logs = data ? Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    })) : [];
    
    return logs;
  } catch (error) {
    console.error('Error fetching login logs:', error);
    throw error;
  }
};

export const logUserLogin = async (userId: string, loginData: { ip: string, userAgent: string }) => {
  try {
    const logId = `log_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const newLog = {
      id: logId,
      userId,
      ip: loginData.ip,
      userAgent: loginData.userAgent,
      timestamp
    };
    
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/loginLogs/${logId}.json`, {
      method: 'PUT',
      body: JSON.stringify(newLog),
    });
    
    if (!response.ok) {
      throw new Error('Failed to log user login');
    }
    
    // Also update user's lastLogin
    await updateUser(userId, { lastLogin: newLog });
    
    return newLog;
  } catch (error) {
    console.error('Error logging user login:', error);
    throw error;
  }
};

export const forceUserLogout = async (userId: string) => {
  try {
    // Set a forced logout timestamp on the user
    return await updateUser(userId, { 
      forcedLogout: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error forcing user logout:', error);
    throw error;
  }
};

// License related functions
import { License } from './types'; // Import the License type from types.ts

export const createLicense = async (licenseData: any) => {
  try {
    const licenseId = `license_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const newLicense = {
      id: licenseId,
      key: `LIC-${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
      isActive: true,
      createdAt: timestamp,
      status: 'active',
      ...licenseData
    };
    
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/licenses/${licenseId}.json`, {
      method: 'PUT',
      body: JSON.stringify(newLicense),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create license');
    }
    
    return newLicense;
  } catch (error) {
    console.error('Error creating license:', error);
    throw error;
  }
};

export const generateLicense = async (type = 'standard', expiryDays?: number) => {
  try {
    // Generate a formatted license key with proper format
    const generateFormattedKey = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar looking characters
      let result = '';
      
      // Create four groups of four characters separated by dashes
      for (let group = 0; group < 4; group++) {
        for (let i = 0; i < 4; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (group < 3) result += '-';
      }
      
      return result;
    };
    
    const licenseKey = generateFormattedKey();
    let expiresAt = undefined;
    
    if (expiryDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      expiresAt = expiryDate.toISOString();
    }
    
    // Map standard/premium/enterprise to the expected type values
    let normalizedType: 'basic' | 'premium' | 'enterprise';
    
    switch (type.toLowerCase()) {
      case 'standard':
        normalizedType = 'basic';
        break;
      case 'premium':
        normalizedType = 'premium';
        break;
      case 'enterprise':
        normalizedType = 'enterprise';
        break;
      default:
        normalizedType = 'basic';
    }
    
    return await createLicense({
      key: licenseKey,
      type: normalizedType,
      expiresAt,
      status: 'active'
    });
  } catch (error) {
    console.error('Error generating license:', error);
    throw error;
  }
};

export const getAllLicenses = async () => {
  try {
    const response = await fetch('https://orgid-f590b-default-rtdb.firebaseio.com/licenses.json');
    
    if (!response.ok) {
      throw new Error('Failed to fetch licenses');
    }
    
    const data = await response.json();
    
    // Convert object to array
    const licenses = data ? Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    })) : [];
    
    return licenses;
  } catch (error) {
    console.error('Error fetching all licenses:', error);
    throw error;
  }
};

export const deleteLicense = async (licenseId: string) => {
  try {
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/licenses/${licenseId}.json`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete license');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting license:', error);
    throw error;
  }
};

export const assignLicenseToUser = async (userId: string, licenseKey: string) => {
  try {
    // Find the license by key
    const licenses = await getAllLicenses();
    const license = licenses.find(lic => lic.key === licenseKey);
    
    if (!license) {
      throw new Error('License not found');
    }
    
    // Update the license with user ID
    await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/licenses/${license.id}.json`, {
      method: 'PATCH',
      body: JSON.stringify({
        userId,
        status: 'active',
        activatedAt: new Date().toISOString()
      }),
    });
    
    // Update user with license info
    await updateUser(userId, {
      licenseActive: true,
      licenseKey: license.key,
      licenseType: license.type,
      licenseId: license.id,
      licenseExpiryDate: license.expiresAt
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error assigning license to user:', error);
    throw error;
  }
};

export const suspendLicense = async (licenseKey: string) => {
  try {
    const license = await getLicenseByKey(licenseKey);
    
    if (!license) {
      throw new Error('License not found');
    }
    
    await updateLicense(license.id, {
      status: 'inactive',
      isActive: false,
      suspendedAt: new Date().toISOString()
    });
    
    // If the license is assigned to a user, update their status
    if (license.userId) {
      await updateUser(license.userId, {
        licenseActive: false
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error suspending license:', error);
    throw error;
  }
};

export const revokeLicense = async (licenseKey: string) => {
  try {
    const license = await getLicenseByKey(licenseKey);
    
    if (!license) {
      throw new Error('License not found');
    }
    
    await updateLicense(license.id, {
      status: 'revoked',
      isActive: false,
      userId: null,
      suspendedAt: new Date().toISOString()
    });
    
    // If the license is assigned to a user, update their status
    if (license.userId) {
      await updateUser(license.userId, {
        licenseActive: false,
        licenseKey: null,
        licenseType: null,
        licenseExpiryDate: null
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error revoking license:', error);
    throw error;
  }
};

// License request functions
export const createLicenseRequest = async (userId: string, username: string, email: string, message?: string) => {
  try {
    const requestId = `req_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const newRequest = {
      id: requestId,
      userId,
      username,
      email,
      message: message || '',
      status: 'pending',
      createdAt: timestamp,
      requestType: 'extension'
    };
    
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/licenseRequests/${requestId}.json`, {
      method: 'PUT',
      body: JSON.stringify(newRequest),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create license request');
    }
    
    return newRequest;
  } catch (error) {
    console.error('Error creating license request:', error);
    throw error;
  }
};

export const getLicenseRequests = async () => {
  try {
    const response = await fetch('https://orgid-f590b-default-rtdb.firebaseio.com/licenseRequests.json');
    
    if (!response.ok) {
      throw new Error('Failed to fetch license requests');
    }
    
    const data = await response.json();
    
    // Convert object to array
    const requests = data ? Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    })) : [];
    
    return requests;
  } catch (error) {
    console.error('Error fetching license requests:', error);
    throw error;
  }
};

export const approveLicenseRequest = async (requestId: string) => {
  try {
    // Get the request
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/licenseRequests/${requestId}.json`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch license request');
    }
    
    const request = await response.json();
    
    if (!request) {
      throw new Error('License request not found');
    }
    
    // Generate a new license
    const license = await generateLicense('basic', 30); // 30-day basic license
    
    // Assign the license to the user
    await assignLicenseToUser(request.userId, license.key);
    
    // Update the request status
    await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/licenseRequests/${requestId}.json`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'approved',
        resolvedAt: new Date().toISOString()
      }),
    });
    
    return { request, license };
  } catch (error) {
    console.error('Error approving license request:', error);
    throw error;
  }
};

export const rejectLicenseRequest = async (requestId: string) => {
  try {
    // Update the request status
    await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/licenseRequests/${requestId}.json`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'rejected',
        resolvedAt: new Date().toISOString()
      }),
    });
    
    return true;
  } catch (error) {
    console.error('Error rejecting license request:', error);
    throw error;
  }
};

// Dashboard customization functions
export const updateDashboardCustomization = async (userId: string, customizationData: any) => {
  try {
    // First get current user
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/users/${userId}.json`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    const userData = await response.json();
    
    // Update customization
    const updatedCustomization = {
      ...userData.customization || {},
      ...customizationData
    };
    
    // Update user
    await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/users/${userId}.json`, {
      method: 'PATCH',
      body: JSON.stringify({
        customization: updatedCustomization
      }),
    });
    
    // Return updated user
    return {
      ...userData,
      customization: updatedCustomization
    };
  } catch (error) {
    console.error('Error updating dashboard customization:', error);
    throw error;
  }
};

export const approveDashboardCustomization = async (userId: string) => {
  try {
    return updateDashboardCustomization(userId, { approved: true });
  } catch (error) {
    console.error('Error approving dashboard customization:', error);
    throw error;
  }
};

export const getLicenseByKey = async (licenseKey: string) => {
  try {
    const licenses = await getAllLicenses();
    return licenses.find(license => license.key === licenseKey);
  } catch (error) {
    console.error('Error fetching license by key:', error);
    throw error;
  }
};

export const updateLicense = async (licenseId: string, updateData: Partial<License>) => {
  try {
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/licenses/${licenseId}.json`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update license');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating license:', error);
    throw error;
  }
};
