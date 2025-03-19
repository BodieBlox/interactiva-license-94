export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'warned' | 'suspended';
  licenseActive: boolean;
  licenseKey?: string;
  warningMessage?: string;
  lastLogin?: LoginLog;
  forcedLogout?: string;
}

export interface License {
  id: string;
  key: string;
  isActive: boolean;
  userId?: string;
  createdAt: string;
  activatedAt?: string;
  suspendedAt?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
}

export interface Chat {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
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
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: string;
  resolvedAt?: string;
}
