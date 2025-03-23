import { User, DashboardCustomization, License, LicenseRequest, ChatMessage, Chat, LoginLog } from './types';
import { database } from './firebase';
import { ref, set, get, push, remove, update, query, orderByChild, equalTo } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

// User related functions
export const getUsers = async (): Promise<User[]> => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);

  if (snapshot.exists()) {
    const users: User[] = [];
    snapshot.forEach((childSnapshot) => {
      users.push({ ...childSnapshot.val(), id: childSnapshot.key } as User);
    });
    return users;
  } else {
    return [];
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  return getUsers(); // Alias for getUsers for backward compatibility
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = ref(database, `users/${userId}`);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    return { ...snapshot.val(), id: snapshot.key } as User;
  } else {
    return null;
  }
};

export const createUser = async (userData: Partial<User>): Promise<User> => {
  // Generate a unique ID if not provided
  const userId = userData.id || push(ref(database, 'users')).key;
  
  if (!userId) {
    throw new Error('Failed to generate user ID');
  }
  
  const newUser: User = {
    id: userId,
    username: userData.username || '',
    email: userData.email || '',
    role: userData.role || 'user',
    status: userData.status || 'active',
    createdAt: new Date().toISOString(),
    // Add any other required fields with defaults
    customization: userData.customization || {},
    licenseActive: false,
  };
  
  // Handle password separately for authentication if present
  const password = userData.password;
  if (password) {
    // Here you would normally use Firebase Authentication
    // This is just a placeholder for the actual auth logic
    console.log(`Would create auth user with email ${userData.email} and password`);
  }
  
  const userRef = ref(database, `users/${userId}`);
  await set(userRef, newUser);
  
  return newUser;
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<User> => {
  const userRef = ref(database, `users/${userId}`);
  await update(userRef, data);

  // Fetch the updated user data
  const updatedUserSnapshot = await get(userRef);
  if (updatedUserSnapshot.exists()) {
    return { ...updatedUserSnapshot.val(), id: updatedUserSnapshot.key } as User;
  } else {
    throw new Error('Failed to fetch updated user data');
  }
};

export const updateUsername = async (userId: string, username: string): Promise<User> => {
  return updateUser(userId, { username });
};

export const updateUserStatus = async (userId: string, status: User['status'], warningMessage?: string): Promise<User> => {
  const updates: Partial<User> = { status };
  
  if (warningMessage) {
    updates.warningMessage = warningMessage;
  } else if (status === 'active') {
    // Clear warning message if activating the user
    updates.warningMessage = '';
  }
  
  return updateUser(userId, updates);
};

export const deleteUser = async (userId: string): Promise<void> => {
  const userRef = ref(database, `users/${userId}`);
  await remove(userRef);
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  if (!email) return null;
  
  const usersRef = ref(database, 'users');
  const userQuery = query(usersRef, orderByChild('email'), equalTo(email));
  const snapshot = await get(userQuery);

  if (snapshot.exists()) {
    // Get the first match (there should be only one user with this email)
    let user: User | null = null;
    snapshot.forEach((childSnapshot) => {
      user = { ...childSnapshot.val(), id: childSnapshot.key } as User;
      return true; // Break the forEach loop after the first match
    });
    return user;
  } else {
    return null;
  }
};

// License related functions
export const createLicense = async (licenseData: Partial<License>): Promise<License> => {
  const licenseId = licenseData.id || push(ref(database, 'licenses')).key;
  
  if (!licenseId) {
    throw new Error('Failed to generate license ID');
  }
  
  const newLicense: License = {
    id: licenseId,
    key: licenseData.key || generateLicenseKey(),
    type: licenseData.type || 'basic',
    isActive: licenseData.isActive !== undefined ? licenseData.isActive : true,
    status: licenseData.status || 'active',
    createdAt: licenseData.createdAt || new Date().toISOString(),
    expiresAt: licenseData.expiresAt,
    assignedTo: licenseData.assignedTo,
  };
  
  const licenseRef = ref(database, `licenses/${licenseId}`);
  await set(licenseRef, newLicense);
  return newLicense;
};

export const generateLicense = async (
  licenseType: 'basic' | 'premium' | 'enterprise' | 'standard', 
  expirationDays?: number
): Promise<License> => {
  // Convert UI license type to internal type if needed
  const internalLicenseType: 'basic' | 'premium' | 'enterprise' = 
    licenseType === 'standard' ? 'basic' : licenseType as 'basic' | 'premium' | 'enterprise';
  
  // Generate license data
  const licenseData: Partial<License> = {
    key: generateLicenseKey(),
    type: internalLicenseType,
    isActive: true,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  
  // Add expiration date if specified
  if (expirationDays !== undefined) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expirationDays);
    licenseData.expiresAt = expiryDate.toISOString();
  }
  
  // Create the license in the database
  return createLicense(licenseData);
};

const generateLicenseKey = (): string => {
  // Generate a random license key
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 24; i++) {
    key += characters.charAt(Math.floor(Math.random() * characters.length));
    if ((i + 1) % 4 === 0 && i < 20) key += '-';
  }
  return key;
};

export const getLicense = async (licenseId: string): Promise<License | null> => {
  const licenseRef = ref(database, `licenses/${licenseId}`);
  const snapshot = await get(licenseRef);

  if (snapshot.exists()) {
    return { ...snapshot.val(), id: snapshot.key } as License;
  } else {
    return null;
  }
};

export const getLicenseByKey = async (licenseKey: string): Promise<License | null> => {
  // First try to get by direct ID in case the key is actually the ID
  const directLicense = await getLicense(licenseKey);
  if (directLicense) {
    return directLicense;
  }
  
  // Otherwise, query licenses by the 'key' field
  const licensesRef = ref(database, 'licenses');
  const licenseQuery = query(licensesRef, orderByChild('key'), equalTo(licenseKey));
  const snapshot = await get(licenseQuery);

  if (snapshot.exists()) {
    // Get the first match (there should be only one)
    let license: License | null = null;
    snapshot.forEach((childSnapshot) => {
      license = { ...childSnapshot.val(), id: childSnapshot.key } as License;
      return true; // Break the forEach loop after the first match
    });
    return license;
  } else {
    return null;
  }
};

export const updateLicense = async (licenseId: string, data: Partial<License>): Promise<License> => {
  const licenseRef = ref(database, `licenses/${licenseId}`);
  await update(licenseRef, data);

  // Fetch the updated license data
  const updatedLicenseSnapshot = await get(licenseRef);
  if (updatedLicenseSnapshot.exists()) {
    return { ...updatedLicenseSnapshot.val(), id: updatedLicenseSnapshot.key } as License;
  } else {
    throw new Error('Failed to fetch updated license data');
  }
};

export const suspendLicense = async (licenseKey: string): Promise<License | null> => {
  const license = await getLicenseByKey(licenseKey);
  if (!license) {
    throw new Error('License not found');
  }
  
  return updateLicense(license.id, { 
    isActive: false, 
    status: 'suspended' as License['status'] 
  });
};

export const revokeLicense = async (licenseKey: string): Promise<void> => {
  const license = await getLicenseByKey(licenseKey);
  if (!license) {
    throw new Error('License not found');
  }
  
  // If license is assigned to a user, update the user's license info
  if (license.assignedTo) {
    await updateUser(license.assignedTo, {
      licenseActive: false,
      licenseKey: undefined,
      licenseType: undefined,
      licenseExpiryDate: undefined
    });
  }
  
  // Delete the license
  await deleteLicense(license.id);
};

export const assignLicenseToUser = async (userId: string, licenseKey: string): Promise<User> => {
  // Get the license by key
  const license = await getLicenseByKey(licenseKey);
  if (!license) {
    throw new Error('License not found');
  }
  
  // Get the user
  const user = await getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Update the license to assign it to the user
  await updateLicense(license.id, {
    assignedTo: userId,
    isActive: true,
    status: 'active'
  });
  
  // Update the user with the license information
  return updateUser(userId, {
    licenseKey: license.key,
    licenseId: license.id,
    licenseType: license.type,
    licenseActive: true,
    licenseExpiryDate: license.expiresAt
  });
};

export const getLicenses = async (): Promise<License[]> => {
  const licensesRef = ref(database, 'licenses');
  const snapshot = await get(licensesRef);

  if (snapshot.exists()) {
    const licenses: License[] = [];
    snapshot.forEach((childSnapshot) => {
      licenses.push({ ...childSnapshot.val(), id: childSnapshot.key } as License);
    });
    return licenses;
  } else {
    return [];
  }
};

export const getAllLicenses = async (): Promise<License[]> => {
  return getLicenses(); // Alias for getLicenses for backward compatibility
};

export const deleteLicense = async (licenseId: string): Promise<void> => {
  const licenseRef = ref(database, `licenses/${licenseId}`);
  await remove(licenseRef);
};

// License request related functions
export const createLicenseRequest = async (
  userId: string, 
  username: string, 
  email: string, 
  message?: string
): Promise<LicenseRequest> => {
  const requestData: LicenseRequest = {
    id: '', // Will be set after push
    userId,
    username,
    email,
    message,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  const requestRef = push(ref(database, 'licenseRequests'));
  const requestId = requestRef.key;

  if (!requestId) {
    throw new Error('Failed to generate request ID');
  }

  // Set the request ID in the object
  const newRequestData = { ...requestData, id: requestId };
  await set(ref(database, `licenseRequests/${requestId}`), newRequestData);
  return newRequestData;
};

export const getLicenseRequests = async (): Promise<LicenseRequest[]> => {
  const requestsRef = ref(database, 'licenseRequests');
  const snapshot = await get(requestsRef);

  if (snapshot.exists()) {
    const requests: LicenseRequest[] = [];
    snapshot.forEach((childSnapshot) => {
      requests.push({ ...childSnapshot.val(), id: childSnapshot.key } as LicenseRequest);
    });
    return requests;
  } else {
    return [];
  }
};

export const getLicenseRequest = async (requestId: string): Promise<LicenseRequest | null> => {
  const requestRef = ref(database, `licenseRequests/${requestId}`);
  const snapshot = await get(requestRef);

  if (snapshot.exists()) {
    return { ...snapshot.val(), id: snapshot.key } as LicenseRequest;
  } else {
    return null;
  }
};

export const updateLicenseRequest = async (requestId: string, data: Partial<LicenseRequest>): Promise<LicenseRequest> => {
  const requestRef = ref(database, `licenseRequests/${requestId}`);
  await update(requestRef, data);

  // Fetch the updated request data
  const updatedRequestSnapshot = await get(requestRef);
  if (updatedRequestSnapshot.exists()) {
    return { ...updatedRequestSnapshot.val(), id: updatedRequestSnapshot.key } as LicenseRequest;
  } else {
    throw new Error('Failed to fetch updated license request data');
  }
};

export const deleteLicenseRequest = async (requestId: string): Promise<void> => {
  const requestRef = ref(database, `licenseRequests/${requestId}`);
  await remove(requestRef);
};

// Dashboard customization
export const updateDashboardCustomization = async (userId: string, customization: DashboardCustomization): Promise<User> => {
  const userRef = ref(database, `users/${userId}/customization`);
  await update(userRef, customization);

  // Fetch the updated user data
  const updatedUserSnapshot = await get(ref(database, `users/${userId}`));
  if (updatedUserSnapshot.exists()) {
    return { ...updatedUserSnapshot.val(), id: updatedUserSnapshot.key } as User;
  } else {
    throw new Error('Failed to fetch updated user data');
  }
};

export const approveDashboardCustomization = async (userId: string): Promise<User> => {
  return updateDashboardCustomization(userId, { approved: true });
};

// License approval
export const approveLicenseRequest = async (requestId: string, reason?: string) => {
  try {
    const requestRef = ref(database, `licenseRequests/${requestId}`);
    const snapshot = await get(requestRef);

    if (!snapshot.exists()) {
      throw new Error('License request not found');
    }

    const request = snapshot.val() as LicenseRequest;
    const { userId, requestType } = request;

    // Get current user data
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      throw new Error('User not found');
    }
    
    const user = userSnapshot.val() as User;
    const updates: Record<string, any> = {};
    
    // Update the request status
    updates[`licenseRequests/${requestId}/status`] = 'approved';
    updates[`licenseRequests/${requestId}/resolvedAt`] = new Date().toISOString();
    if (reason) {
      updates[`licenseRequests/${requestId}/approvalReason`] = reason;
    }
    
    // Handle extension - extend current license by 30 days
    if (requestType === 'extension') {
      const currentExpiry = user.licenseExpiryDate 
        ? new Date(user.licenseExpiryDate)
        : new Date();
      
      // Add 30 days to current expiry
      const newExpiryDate = new Date(currentExpiry);
      newExpiryDate.setDate(newExpiryDate.getDate() + 30);
      
      // Update user's license expiry date
      updates[`users/${userId}/licenseExpiryDate`] = newExpiryDate.toISOString();
      updates[`users/${userId}/licenseActive`] = true;
      
      // If they had a license, also update the license record
      if (user.licenseId) {
        updates[`licenses/${user.licenseId}/expiresAt`] = newExpiryDate.toISOString();
        updates[`licenses/${user.licenseId}/status`] = 'active';
      }
    }
    
    // Handle upgrade - change license type to premium or enterprise
    if (requestType === 'upgrade') {
      // Default to premium upgrade unless they're already premium
      let newType: 'basic' | 'premium' | 'enterprise' = 'premium';
      
      // If they're already premium, upgrade to enterprise
      if (user.licenseType === 'premium') {
        newType = 'enterprise';
      }
      
      // Update user license type
      updates[`users/${userId}/licenseType`] = newType;
      updates[`users/${userId}/licenseActive`] = true;
      
      // Also ensure expiry date is set if not already
      if (!user.licenseExpiryDate) {
        const newExpiryDate = new Date();
        newExpiryDate.setDate(newExpiryDate.getDate() + 30);
        updates[`users/${userId}/licenseExpiryDate`] = newExpiryDate.toISOString();
      }
      
      // If they had a license, also update the license record
      if (user.licenseId) {
        updates[`licenses/${user.licenseId}/type`] = newType;
        updates[`licenses/${user.licenseId}/status`] = 'active';
      }
    }
    
    // Apply all updates atomically
    await update(ref(database), updates);
    
    return { success: true, message: 'License request approved' };
  } catch (error) {
    console.error('Error approving license request:', error);
    throw error;
  }
};

export const rejectLicenseRequest = async (requestId: string, reason: string) => {
  try {
    const updates: Record<string, any> = {};

    // Update the request status to 'rejected'
    updates[`licenseRequests/${requestId}/status`] = 'rejected';
    updates[`licenseRequests/${requestId}/resolvedAt`] = new Date().toISOString();
    updates[`licenseRequests/${requestId}/rejectionReason`] = reason;

    await update(ref(database), updates);

    return { success: true, message: 'License request rejected' };
  } catch (error) {
    console.error('Error rejecting license request:', error);
    throw error;
  }
};

// Login logs
export const logUserLogin = async (userId: string, loginData: { ip: string, userAgent: string }) => {
  const loginRef = push(ref(database, `loginLogs/${userId}`));
  const loginId = loginRef.key;

  if (!loginId) {
    throw new Error('Failed to generate login ID');
  }

  const loginLog = {
    id: loginId,
    userId,
    ip: loginData.ip,
    userAgent: loginData.userAgent,
    timestamp: new Date().toISOString()
  };

  await set(loginRef, loginLog);
  
  // Also update the user's lastLogin
  await update(ref(database, `users/${userId}`), {
    lastLogin: loginLog
  });

  return loginLog;
};

export const getLoginLogs = async (): Promise<LoginLog[]> => {
  // Fetch login logs for all users
  const logsRef = ref(database, 'loginLogs');
  const snapshot = await get(logsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const logs: LoginLog[] = [];
  
  // Iterate through all user IDs
  snapshot.forEach(userSnapshot => {
    // Iterate through all logs for this user
    userSnapshot.forEach(logSnapshot => {
      logs.push({ ...logSnapshot.val(), id: logSnapshot.key } as LoginLog);
    });
  });
  
  // Sort by timestamp, most recent first
  return logs.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const forceUserLogout = async (userId: string): Promise<void> => {
  // Update the forcedLogout property with a timestamp string instead of boolean
  await updateUser(userId, { forcedLogout: new Date().toISOString() });
};

// Chat related functions
export const createChat = async (userId: string, title: string): Promise<Chat> => {
  const newChat: Chat = {
    id: uuidv4(),
    userId,
    title,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPinned: false // Added this field as it's used in the UI
  };

  console.log('Creating new chat:', newChat);
  const chatRef = ref(database, `chat/${newChat.id}`);
  await set(chatRef, newChat);
  return newChat;
};

export const getUserChats = async (userId: string): Promise<Chat[]> => {
  if (!userId) {
    console.error('getUserChats called with empty userId');
    return [];
  }
  
  try {
    // Query the chats by userId
    console.log('Querying chats for userId:', userId);
    const chatsRef = query(ref(database, 'chat'), orderByChild('userId'), equalTo(userId));
    const snapshot = await get(chatsRef);
    
    if (!snapshot.exists()) {
      console.log('No chats found for this user');
      return [];
    }
    
    // Convert the snapshot to an array of Chat objects
    const chats: Chat[] = [];
    snapshot.forEach((childSnapshot) => {
      const chat = childSnapshot.val();
      // Ensure the chat has an id property
      if (!chat.id && childSnapshot.key) {
        chat.id = childSnapshot.key;
      }
      
      // Ensure messages is an array
      if (!chat.messages) {
        chat.messages = [];
      }
      
      chats.push(chat);
    });
    
    console.log(`Found ${chats.length} chats for user`);
    return chats;
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return [];
  }
};

export const getAllChats = async (): Promise<Chat[]> => {
  try {
    console.log('Fetching all chats');
    const chatsRef = ref(database, 'chat');
    const snapshot = await get(chatsRef);
    
    if (!snapshot.exists()) {
      console.log('No chats found in the database');
      return [];
    }
    
    const chats: Chat[] = [];
    snapshot.forEach((childSnapshot) => {
      const chat = childSnapshot.val();
      // Ensure the chat has an id property
      if (!chat.id && childSnapshot.key) {
        chat.id = childSnapshot.key;
      }
      
      // Ensure messages is an array
      if (!chat.messages) {
        chat.messages = [];
      } else if (!Array.isArray(chat.messages)) {
        // In Firebase, if messages is an object with keys, convert to array
        const messagesArray: ChatMessage[] = [];
        Object.keys(chat.messages).forEach(key => {
          const message = chat.messages[key];
          if (!message.id) {
            message.id = key;
          }
          messagesArray.push(message);
        });
        chat.messages = messagesArray.sort((a, b) => {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });
      }
      
      chats.push(chat);
    });
    
    console.log(`Found ${chats.length} total chats`);
    return chats;
  } catch (error) {
    console.error('Error fetching all chats:', error);
    return [];
  }
};

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  if (!chatId) {
    console.error('getChatById called with empty chatId');
    return null;
  }
  
  try {
    console.log('Fetching chat by ID:', chatId);
    const chatRef = ref(database, `chat/${chatId}`);
    const snapshot = await get(chatRef);
    
    if (!snapshot.exists()) {
      console.log('Chat not found:', chatId);
      return null;
    }
    
    const chat = snapshot.val();
    // Ensure the chat has an id property
    if (!chat.id) {
      chat.id = snapshot.key;
    }
    
    // Ensure messages is an array
    if (!chat.messages) {
      chat.messages = [];
    } else if (!Array.isArray(chat.messages)) {
      // In Firebase, if messages is an object with keys, convert to array
      const messagesArray: ChatMessage[] = [];
      Object.keys(chat.messages).forEach(key => {
        const message = chat.messages[key];
        if (!message.id) {
          message.id = key;
        }
        messagesArray.push(message);
      });
      chat.messages = messagesArray.sort((a, b) => {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
    }
    
    console.log('Chat retrieved successfully:', chat.id);
    return chat;
  } catch (error) {
    console.error('Error fetching chat by ID:', error);
    return null;
  }
};

export const sendMessage = async (chatId: string, content: string, role: 'user' | 'assistant'): Promise<ChatMessage> => {
  const messageRef = push(ref(database, `chat/${chatId}/messages`));
  const messageId = messageRef.key;
  
  if (!messageId) {
    throw new Error('Failed to generate message ID');
  }
  
  const timestamp = new Date().toISOString();
  
  const messageData: ChatMessage = {
    id: messageId,
    content,
    role,
    timestamp
  };
  
  // Add the message to the chat
  await set(messageRef, messageData);
  
  // Update the chat's updatedAt timestamp
  await update(ref(database, `chat/${chatId}`), {
    updatedAt: timestamp
  });
  
  return messageData;
};

export const addMessageToChat = async (chatId: string, messageData: Partial<ChatMessage>): Promise<ChatMessage> => {
  const messageRef = push(ref(database, `chat/${chatId}/messages`));
  const messageId = messageRef.key || '';
  
  const timestamp = new Date().toISOString();
  
  const completeMessage: ChatMessage = {
    id: messageId,
    content: messageData.content || '',
    role: messageData.role || 'assistant',
    timestamp,
    isAdminAction: messageData.isAdminAction,
    adminActionResult: messageData.adminActionResult
  };
  
  await set(messageRef, completeMessage);
  
  // Update the chat's updatedAt timestamp
  await update(ref(database, `chat/${chatId}`), {
    updatedAt: timestamp
  });
  
  return completeMessage;
};

export const clearUserChatHistory = async (userId: string): Promise<void> => {
  // Get all chats for the user
  const userChats = await getUserChats(userId);
  
  // Delete each chat
  const deletePromises = userChats.map(chat => 
    remove(ref(database, `chat/${chat.id}`))
  );
  
  await Promise.all(deletePromises);
};

