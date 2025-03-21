
import { User } from './types';

export interface Company {
  id: string;
  name: string;
  adminId: string;
  createdAt: string;
  updatedAt: string;
  branding: CompanyBranding;
  members: string[]; // User IDs
}

export interface CompanyBranding {
  primaryColor: string;
  logo?: string;
  displayName?: string;
  approved: boolean;
}

export interface CompanyInvitation {
  id: string;
  fromUserId: string;
  fromUsername: string;
  companyId: string;
  companyName: string;
  toUserId: string;
  toEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
  primaryColor?: string;
}

export interface CompanyMember {
  userId: string;
  companyId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  invitedBy: string;
}

// Extend the User type with company information
export interface UserWithCompany extends User {
  company?: {
    id: string;
    name: string;
    role: 'admin' | 'member';
    branding: CompanyBranding;
  };
  pendingInvitations?: CompanyInvitation[];
}
