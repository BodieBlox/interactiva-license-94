
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'warned' | 'suspended';
  licenseActive: boolean;
  licenseKey?: string;
  warningMessage?: string;
}

export interface License {
  id: string;
  key: string;
  isActive: boolean;
  userId?: string;
  createdAt: string;
  activatedAt?: string;
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
