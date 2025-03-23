
import { User } from './types';

export interface Company {
  id: string;
  name: string;
  adminId: string;
  branding?: {
    primaryColor?: string;
    logo?: string;
    approved?: boolean;
  };
  members?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserWithCompany extends User {
  companyRole?: 'admin' | 'member';
}

export interface CompanyInvitation {
  id?: string;
  fromUserId: string;
  fromUsername: string;
  companyName: string;
  companyId?: string;
  toUserId?: string;
  toEmail?: string;
  timestamp: string;
  primaryColor?: string;
  logo?: string;
}

// Function to sanitize company data by removing undefined values
export const sanitizeCompanyData = (data: Partial<Company>): Partial<Company> => {
  return Object.entries(data).reduce((cleanObj: Record<string, any>, [key, value]) => {
    // Only include properties that aren't undefined
    if (value !== undefined) {
      // If it's an object, recursively sanitize it
      if (value !== null && typeof value === 'object') {
        cleanObj[key] = sanitizeObject(value);
      } else {
        cleanObj[key] = value;
      }
    }
    return cleanObj;
  }, {});
};

// Function to sanitize dashboard customization data
export const sanitizeCustomizationData = (data: any): Record<string, any> => {
  if (!data) return {};
  
  return Object.entries(data).reduce((cleanObj: Record<string, any>, [key, value]) => {
    // Skip undefined or null values
    if (value !== undefined && value !== null) {
      // If empty string and not a boolean, skip it too
      if (typeof value === 'string' && value.trim() === '' && typeof value !== 'boolean') {
        return cleanObj;
      }
      
      // If it's an object, recursively sanitize it
      if (typeof value === 'object' && !Array.isArray(value)) {
        cleanObj[key] = sanitizeObject(value);
      } else {
        cleanObj[key] = value;
      }
    }
    return cleanObj;
  }, {});
};

// Function to sanitize user data
export const sanitizeUserData = (data: Partial<User>): Partial<User> => {
  return Object.entries(data).reduce((cleanObj: Record<string, any>, [key, value]) => {
    // Only include properties that aren't undefined
    if (value !== undefined) {
      // Special handling for customization
      if (key === 'customization' && value !== null) {
        cleanObj[key] = sanitizeCustomizationData(value);
      } 
      // If it's another object, recursively sanitize it
      else if (value !== null && typeof value === 'object') {
        cleanObj[key] = sanitizeObject(value);
      } else {
        cleanObj[key] = value;
      }
    }
    return cleanObj;
  }, {});
};

// Helper function to sanitize any object
const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
  return Object.entries(obj).reduce((cleanObj: Record<string, any>, [key, value]) => {
    if (value !== undefined && value !== null) {
      // If it's an object, recursively sanitize it
      if (typeof value === 'object' && !Array.isArray(value)) {
        cleanObj[key] = sanitizeObject(value);
      } else {
        cleanObj[key] = value;
      }
    }
    return cleanObj;
  }, {});
};
