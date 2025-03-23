
export interface Company {
  id: string;
  name: string;
  adminId: string;
  createdAt: string;
  updatedAt: string;
  branding?: {
    primaryColor?: string;
    logo?: string;
    approved?: boolean;
  };
  members: string[];
}

export interface UserWithCompany {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'warned' | 'suspended';
  company: {
    id: string;
    name: string;
    role: 'admin' | 'member';
    branding?: {
      primaryColor?: string;
      logo?: string;
      approved?: boolean;
    };
  };
}

export interface CompanyMember {
  userId: string;
  companyId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  invitedBy: string;
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
  logo?: string;
}
