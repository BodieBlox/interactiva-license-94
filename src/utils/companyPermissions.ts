import { UserWithCompany } from './companyTypes';

export type PermissionLevel = 'owner' | 'admin' | 'member' | 'guest';

export interface MemberPermissions {
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canEditBranding: boolean;
  canViewAnalytics: boolean;
  canViewBilling: boolean;
  canManagePermissions: boolean;
  canModifySettings: boolean;
  canCreateContent: boolean;
  canApproveContent: boolean;
  canExportData: boolean;
  maxMembers?: number;
  maxProjects?: number;
  maxStorage?: number; // in MB
}

// Default permission presets
export const permissionPresets: Record<PermissionLevel, MemberPermissions> = {
  owner: {
    canInviteMembers: true,
    canRemoveMembers: true,
    canEditBranding: true,
    canViewAnalytics: true,
    canViewBilling: true,
    canManagePermissions: true,
    canModifySettings: true,
    canCreateContent: true,
    canApproveContent: true,
    canExportData: true,
    maxMembers: Infinity,
    maxProjects: Infinity,
    maxStorage: Infinity
  },
  admin: {
    canInviteMembers: true,
    canRemoveMembers: true,
    canEditBranding: true,
    canViewAnalytics: true,
    canViewBilling: true,
    canManagePermissions: false,
    canModifySettings: true,
    canCreateContent: true,
    canApproveContent: true,
    canExportData: true,
    maxMembers: 50,
    maxProjects: 20,
    maxStorage: 10240 // 10GB
  },
  member: {
    canInviteMembers: false,
    canRemoveMembers: false,
    canEditBranding: false,
    canViewAnalytics: true,
    canViewBilling: false,
    canManagePermissions: false,
    canModifySettings: false,
    canCreateContent: true,
    canApproveContent: false,
    canExportData: false,
    maxMembers: 0,
    maxProjects: 5,
    maxStorage: 1024 // 1GB
  },
  guest: {
    canInviteMembers: false,
    canRemoveMembers: false,
    canEditBranding: false,
    canViewAnalytics: false,
    canViewBilling: false,
    canManagePermissions: false,
    canModifySettings: false,
    canCreateContent: false,
    canApproveContent: false,
    canExportData: false,
    maxMembers: 0,
    maxProjects: 1,
    maxStorage: 100 // 100MB
  }
};

// Helper function to check if a user has a specific permission
export const hasPermission = (
  user: UserWithCompany | null, 
  permission: keyof MemberPermissions
): boolean => {
  if (!user) return false;
  
  // Company owners and admins have all permissions
  if (user.isCompanyAdmin || user.role === 'admin') {
    return true;
  }
  
  // Check company role-based permissions
  const rolePermissions = user.companyRole ? permissionPresets[user.companyRole === 'admin' ? 'admin' : 'member'] : permissionPresets.guest;
  
  // Ensure we return boolean for permission checks
  const value = rolePermissions[permission];
  
  if (typeof value === 'boolean') {
    return value;
  } else if (typeof value === 'number') {
    // Convert numeric values to boolean (any non-zero value is true)
    return value > 0;
  }
  
  return false;
};

// Helper function to get a user's permission level
export const getUserPermissionLevel = (user: UserWithCompany | null): PermissionLevel => {
  if (!user) return 'guest';
  if (user.role === 'admin') return 'owner';
  if (user.isCompanyAdmin) return 'admin';
  if (user.companyRole === 'admin') return 'admin';
  if (user.companyRole === 'member') return 'member';
  return 'guest';
};

// Helper function to get all permissions for a user
export const getUserPermissions = (user: UserWithCompany | null): MemberPermissions => {
  if (!user) return permissionPresets.guest;
  
  const permissionLevel = getUserPermissionLevel(user);
  return permissionPresets[permissionLevel];
};
