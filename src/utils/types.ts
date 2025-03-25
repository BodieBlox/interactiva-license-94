
export type UserRole = 'admin' | 'user' | 'staff';

export interface User {
  id: string;
  email: string;
  username?: string;
  createdAt?: string;
  status: 'active' | 'warned' | 'suspended';
  role: UserRole;
  companyId?: string;
  warningMessage?: string | null;
  lastLogin?: string | null;
  invitationAccepted?: boolean;
  canInviteUsers?: boolean;
  emailVerified?: boolean;
  passwordResetRequested?: boolean;
  passwordResetToken?: string | null;
  passwordResetExpires?: string | null;
  profileImageUrl?: string | null;
  
  // Modified properties - removing individual license fields
  customization?: DashboardCustomization;
  isCompanyAdmin?: boolean;
  forcedLogout?: string;
  password?: string; // Only used during user creation, not stored
}

export interface DashboardCustomization {
  primaryColor?: string;
  logo?: string;
  companyName?: string;
  companyId?: string;
  approved?: boolean;
  isCompanyMember?: boolean;
  pendingInvitation?: CompanyInvitation;
}

export interface CompanyInvitation {
  id?: string;
  fromUserId: string;
  fromUsername: string;
  companyName: string;
  companyId?: string;
  timestamp: string;
  primaryColor?: string;
  logo?: string;
  status?: 'pending' | 'accepted' | 'declined';
  toUserId?: string;
  toEmail?: string;
}

export interface License {
  id: string;
  key: string;
  isActive: boolean;
  companyId?: string; // Changed from userId to companyId
  createdAt: string;
  activatedAt?: string;
  suspendedAt?: string;
  expiresAt?: string;
  status: 'active' | 'inactive' | 'revoked' | 'suspended';
  type: 'basic' | 'premium' | 'enterprise';
  maxUsers?: number; // Added for user limit per license
}

export interface Company {
  id: string;
  name: string;
  adminId: string; // Primary company owner
  licenseKey?: string;
  licenseId?: string;
  licenseType?: string;
  licenseActive?: boolean;
  licenseExpiryDate?: string;
  members?: string[];
  createdAt: string;
  updatedAt: string;
  branding?: {
    primaryColor?: string;
    logo?: string;
    approved?: boolean;
  };
  description?: string;
  industry?: string;
  size?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  isAdminAction?: boolean;
  adminActionResult?: string;
  isLoading?: boolean;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  messages?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
}

export interface LoginLog {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  timestamp: string;
}

export interface LicenseRequest {
  id: string;
  companyId: string; // Changed from userId to companyId
  companyName: string; // Added company name
  adminName: string; // Changed from username
  email: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  requestType?: 'extension' | 'upgrade';
}

export interface AdminAction {
  type: 'user_list' | 'user_details' | 'suspend_user' | 'warn_user' | 'activate_user' | 'revoke_license' | 'suspend_license';
  targetUserId?: string;
  targetUsername?: string;
  targetEmail?: string;
  message?: string;
  result?: string;
}
