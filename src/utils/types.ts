export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'warned' | 'suspended';
  licenseActive: boolean;
  licenseKey?: string;
  licenseType?: 'basic' | 'premium' | 'enterprise';
  licenseId?: string;
  licenseTier?: string;
  licenseExpiryDate?: string;
  createdAt?: string;
  isCompanyAdmin?: boolean;
  warningMessage?: string;
  lastLogin?: LoginLog;
  forcedLogout?: string;
  password?: string;
  customization?: DashboardCustomization;
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
}

export interface License {
  id: string;
  key: string;
  isActive: boolean;
  userId?: string;
  createdAt: string;
  activatedAt?: string;
  suspendedAt?: string;
  expiresAt?: string;
  status: 'active' | 'inactive' | 'revoked' | 'suspended';
  type: 'basic' | 'premium' | 'enterprise';
  assignedTo?: string;
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
  userId: string;
  username: string;
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
