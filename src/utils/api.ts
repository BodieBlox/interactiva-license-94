
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, setDoc, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { User, License, Chat, ChatMessage } from './types';
import { db } from './firebase';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: "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",
  dangerouslyAllowBrowser: true // Only for client-side usage
});

// Authentication methods
export const loginUser = async (email: string, password: string): Promise<User> => {
  // This is now handled in AuthContext using Firebase auth
  // This function is kept for compatibility
  return Promise.reject(new Error('This function is deprecated. Use AuthContext.login instead.'));
};

export const activateLicense = async (userId: string, licenseKey: string): Promise<User> => {
  // This is now handled in AuthContext
  // This function is kept for compatibility
  return Promise.reject(new Error('This function is deprecated. Use AuthContext.activateUserLicense instead.'));
};

// Admin API methods
export const getUsers = async (): Promise<User[]> => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.docs.map((doc) => doc.data() as User);
  } catch (error) {
    console.error('Error getting users:', error);
    return Promise.reject(error);
  }
};

export const updateUserStatus = async (userId: string, status: User['status'], warningMessage?: string): Promise<User> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return Promise.reject(new Error('User not found'));
    }
    
    const userData = userDoc.data() as User;
    const updatedUser = {
      ...userData,
      status,
      ...(warningMessage && { warningMessage })
    };
    
    await updateDoc(userRef, updatedUser);
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user status:', error);
    return Promise.reject(error);
  }
};

export const generateLicense = async (): Promise<License> => {
  try {
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
      id: key, // Use the key as the ID
      key,
      isActive: false,
      createdAt: new Date().toISOString()
    };
    
    // Add the license to Firestore
    await setDoc(doc(db, 'licenses', key), newLicense);
    
    return newLicense;
  } catch (error) {
    console.error('Error generating license:', error);
    return Promise.reject(error);
  }
};

export const getLicenses = async (): Promise<License[]> => {
  try {
    const licensesSnapshot = await getDocs(collection(db, 'licenses'));
    return licensesSnapshot.docs.map((doc) => doc.data() as License);
  } catch (error) {
    console.error('Error getting licenses:', error);
    return Promise.reject(error);
  }
};

// Chat API methods
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    const chatQuery = query(
      collection(db, 'chats'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const chatsSnapshot = await getDocs(chatQuery);
    const chats: Chat[] = [];
    
    for (const chatDoc of chatsSnapshot.docs) {
      const chatData = chatDoc.data();
      
      // Get messages for this chat
      const messagesQuery = query(
        collection(db, 'chats', chatDoc.id, 'messages'),
        orderBy('timestamp', 'asc')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          content: data.content,
          role: data.role,
          timestamp: data.timestamp.toDate().toISOString()
        } as ChatMessage;
      });
      
      chats.push({
        id: chatDoc.id,
        title: chatData.title,
        userId: chatData.userId,
        createdAt: chatData.createdAt.toDate().toISOString(),
        updatedAt: chatData.updatedAt.toDate().toISOString(),
        messages
      });
    }
    
    return chats;
  } catch (error) {
    console.error('Error getting user chats:', error);
    return Promise.reject(error);
  }
};

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    
    if (!chatDoc.exists()) {
      return null;
    }
    
    const chatData = chatDoc.data();
    
    // Get messages for this chat
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    const messages = messagesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        content: data.content,
        role: data.role,
        timestamp: data.timestamp.toDate().toISOString()
      } as ChatMessage;
    });
    
    return {
      id: chatDoc.id,
      title: chatData.title,
      userId: chatData.userId,
      createdAt: chatData.createdAt.toDate().toISOString(),
      updatedAt: chatData.updatedAt.toDate().toISOString(),
      messages
    };
  } catch (error) {
    console.error('Error getting chat by ID:', error);
    return Promise.reject(error);
  }
};

export const createChat = async (userId: string, title: string): Promise<Chat> => {
  try {
    const chatRef = await addDoc(collection(db, 'chats'), {
      title,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    const newChat: Chat = {
      id: chatRef.id,
      title,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    
    return newChat;
  } catch (error) {
    console.error('Error creating chat:', error);
    return Promise.reject(error);
  }
};

export const sendMessage = async (chatId: string, content: string): Promise<ChatMessage> => {
  try {
    // Get the chat to ensure it exists
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    
    if (!chatDoc.exists()) {
      return Promise.reject(new Error('Chat not found'));
    }
    
    // Add the user message
    const userMessageRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
      content,
      role: 'user',
      timestamp: serverTimestamp()
    });
    
    // Update the chat's updatedAt timestamp
    await updateDoc(doc(db, 'chats', chatId), {
      updatedAt: serverTimestamp()
    });
    
    // Create and return the user message
    const userMessage: ChatMessage = {
      id: userMessageRef.id,
      content,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    // Generate AI response asynchronously
    generateAiResponse(chatId, content);
    
    return userMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    return Promise.reject(error);
  }
};

// Helper function to generate AI response
const generateAiResponse = async (chatId: string, userMessage: string) => {
  try {
    // Get previous messages for context
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    const messages = messagesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        role: data.role,
        content: data.content
      };
    });
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        ...messages
      ]
    });
    
    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    
    // Add the AI response to the chat
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      content: aiResponse,
      role: 'assistant',
      timestamp: serverTimestamp()
    });
    
    // Update the chat's updatedAt timestamp
    await updateDoc(doc(db, 'chats', chatId), {
      updatedAt: serverTimestamp()
    });
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Add an error message
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      content: "Sorry, I encountered an error while generating a response. Please try again.",
      role: 'assistant',
      timestamp: serverTimestamp()
    });
    
    // Update the chat's updatedAt timestamp
    await updateDoc(doc(db, 'chats', chatId), {
      updatedAt: serverTimestamp()
    });
  }
};
