
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

// Utility functions to ensure no undefined values are saved to the database
export function sanitizeCompanyData(company: Partial<Company>): Partial<Company> {
  const sanitized: Partial<Company> = {};
  
  // Only include defined properties
  if (company.id !== undefined) sanitized.id = company.id;
  if (company.name !== undefined) sanitized.name = company.name;
  if (company.adminId !== undefined) sanitized.adminId = company.adminId;
  if (company.createdAt !== undefined) sanitized.createdAt = company.createdAt;
  if (company.updatedAt !== undefined) sanitized.updatedAt = company.updatedAt;
  if (company.members !== undefined) sanitized.members = company.members;
  
  // Handle nested objects
  if (company.branding) {
    sanitized.branding = {};
    if (company.branding.primaryColor !== undefined) 
      sanitized.branding.primaryColor = company.branding.primaryColor;
    if (company.branding.logo !== undefined) 
      sanitized.branding.logo = company.branding.logo;
    if (company.branding.approved !== undefined) 
      sanitized.branding.approved = company.branding.approved;
  }
  
  return sanitized;
}

// Helper function to sanitize customization data
export function sanitizeCustomizationData(customization: any): any {
  if (!customization) return {};
  
  const sanitized: any = {};
  
  // For companyName and other direct properties
  if (customization.companyName !== undefined) 
    sanitized.companyName = customization.companyName;
  else if (customization.companyName === undefined && 'companyName' in customization)
    sanitized.companyName = null; // Use null instead of undefined for explicit removal
    
  if (customization.primaryColor !== undefined) 
    sanitized.primaryColor = customization.primaryColor;
  if (customization.isCompanyMember !== undefined) 
    sanitized.isCompanyMember = customization.isCompanyMember;
  if (customization.approved !== undefined) 
    sanitized.approved = customization.approved;
  
  // Handle nested pendingInvitation object if it exists
  if (customization.pendingInvitation) {
    sanitized.pendingInvitation = {};
    
    const invitation = customization.pendingInvitation;
    if (invitation.fromUserId !== undefined) 
      sanitized.pendingInvitation.fromUserId = invitation.fromUserId;
    if (invitation.fromUsername !== undefined) 
      sanitized.pendingInvitation.fromUsername = invitation.fromUsername;
    if (invitation.companyName !== undefined) 
      sanitized.pendingInvitation.companyName = invitation.companyName;
    if (invitation.timestamp !== undefined) 
      sanitized.pendingInvitation.timestamp = invitation.timestamp;
    if (invitation.primaryColor !== undefined) 
      sanitized.pendingInvitation.primaryColor = invitation.primaryColor;
  } else if (customization.pendingInvitation === null) {
    sanitized.pendingInvitation = null;
  }
  
  return sanitized;
}

// Helper function to sanitize user data to prevent undefined values
export function sanitizeUserData(userData: any): any {
  if (!userData) return {};
  
  const sanitized: any = {};
  
  // Only include defined properties for user updates
  if (userData.username !== undefined) sanitized.username = userData.username;
  if (userData.email !== undefined) sanitized.email = userData.email;
  if (userData.role !== undefined) sanitized.role = userData.role;
  if (userData.status !== undefined) sanitized.status = userData.status;
  if (userData.licenseActive !== undefined) sanitized.licenseActive = userData.licenseActive;
  if (userData.licenseKey !== undefined) sanitized.licenseKey = userData.licenseKey;
  if (userData.licenseType !== undefined) sanitized.licenseType = userData.licenseType;
  if (userData.isCompanyAdmin !== undefined) sanitized.isCompanyAdmin = userData.isCompanyAdmin;
  if (userData.warningMessage !== undefined) sanitized.warningMessage = userData.warningMessage;
  
  return sanitized;
}
