import { database } from './firebase';
import { ref, get, push, set, update, query, orderByChild, equalTo } from 'firebase/database';
import { User } from './types';
import { updateUser } from './api';
import { Company, UserWithCompany, CompanyInvitation } from './companyTypes';
import { v4 as uuidv4 } from 'uuid';

// Company CRUD functions
export const createCompany = async (companyData: Partial<Company>, adminUserId: string): Promise<Company> => {
  try {
    const companyId = uuidv4();
    const companiesRef = ref(database, `companies/${companyId}`);
    
    const newCompany: Company = {
      id: companyId,
      name: companyData.name || 'New Company',
      adminId: adminUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [adminUserId],
      branding: companyData.branding || {
        primaryColor: '#6366f1',
        logo: '',
        approved: false
      }
    };
    
    await set(companiesRef, newCompany);
    return newCompany;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

export const getCompanies = async (): Promise<Company[]> => {
  try {
    const companiesRef = ref(database, 'companies');
    const snapshot = await get(companiesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const companies: Company[] = [];
    snapshot.forEach((childSnapshot) => {
      const company = childSnapshot.val() as Company;
      companies.push(company);
    });
    
    return companies;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
};

export const getCompanyById = async (companyId: string): Promise<Company | null> => {
  try {
    const companyRef = ref(database, `companies/${companyId}`);
    const snapshot = await get(companyRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return snapshot.val() as Company;
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
};

export const updateCompany = async (companyId: string, updates: Partial<Company>): Promise<Company> => {
  try {
    const companyRef = ref(database, `companies/${companyId}`);
    await update(companyRef, updates);
    
    const updatedSnapshot = await get(companyRef);
    return updatedSnapshot.val() as Company;
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

export const updateCompanyLogo = async (companyId: string, logoUrl: string): Promise<Company> => {
  try {
    const company = await getCompanyById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }
    
    const updates = {
      branding: {
        ...company.branding,
        logo: logoUrl
      }
    };
    
    return updateCompany(companyId, updates);
  } catch (error) {
    console.error('Error updating company logo:', error);
    throw error;
  }
};

// Company member management functions
export const getCompanyMembers = async (companyId: string): Promise<UserWithCompany[]> => {
  try {
    const company = await getCompanyById(companyId);
    if (!company || !company.members || company.members.length === 0) {
      return [];
    }
    
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const members: UserWithCompany[] = [];
    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val() as User;
      if (company.members.includes(user.id)) {
        // Create a UserWithCompany without using the 'company' property
        const memberWithRole: UserWithCompany = {
          ...user,
          companyRole: user.id === company.adminId ? 'admin' : 'member'
        };
        members.push(memberWithRole);
      }
    });
    
    return members;
  } catch (error) {
    console.error('Error fetching company members:', error);
    throw error;
  }
};

export const addCompanyMember = async (companyId: string, userId: string): Promise<void> => {
  try {
    const company = await getCompanyById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }
    
    if (!company.members) {
      company.members = [];
    }
    
    if (!company.members.includes(userId)) {
      company.members.push(userId);
      await updateCompany(companyId, { members: company.members });
    }
  } catch (error) {
    console.error('Error adding company member:', error);
    throw error;
  }
};

export const removeCompanyMember = async (companyId: string, userId: string): Promise<void> => {
  try {
    const company = await getCompanyById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }
    
    if (!company.members) {
      return;
    }
    
    const updatedMembers = company.members.filter(id => id !== userId);
    await updateCompany(companyId, { members: updatedMembers });
  } catch (error) {
    console.error('Error removing company member:', error);
    throw error;
  }
};

// Company invitation functions
export const sendCompanyInvitation = async (invitationData: {
  fromUserId: string;
  fromUsername: string;
  companyId: string;
  companyName: string;
  toUserId: string;
  toEmail: string;
  primaryColor?: string;
  logo?: string;
}): Promise<void> => {
  try {
    // Create invitation
    const invitation: CompanyInvitation = {
      id: uuidv4(),
      fromUserId: invitationData.fromUserId,
      fromUsername: invitationData.fromUsername,
      companyName: invitationData.companyName,
      companyId: invitationData.companyId,
      toUserId: invitationData.toUserId,
      toEmail: invitationData.toEmail,
      timestamp: new Date().toISOString(),
      primaryColor: invitationData.primaryColor,
      logo: invitationData.logo,
      status: 'pending' // Add the status field
    };
    
    // Save the invitation
    const invitationsRef = ref(database, `companyInvitations/${invitation.id}`);
    await set(invitationsRef, invitation);
    
    // Add the invitation to the receiver's user record
    await updateUser(invitationData.toUserId, {
      customization: {
        pendingInvitation: invitation
      }
    });
  } catch (error) {
    console.error('Error sending company invitation:', error);
    throw error;
  }
};

export const getCompanyInvitationsByUser = async (userId: string): Promise<CompanyInvitation[]> => {
  try {
    const invitationsRef = ref(database, 'companyInvitations');
    const snapshot = await get(invitationsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const invitations: CompanyInvitation[] = [];
    snapshot.forEach((childSnapshot) => {
      const invitation = childSnapshot.val() as CompanyInvitation;
      if (invitation.fromUserId === userId) {
        invitations.push(invitation);
      }
    });
    
    return invitations;
  } catch (error) {
    console.error('Error fetching company invitations:', error);
    throw error;
  }
};

// Company invitation functions from the existing code
export const acceptCompanyInvitation = async (invitationId: string, userId: string): Promise<User> => {
  try {
    // Get the user
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      throw new Error("User not found");
    }
    
    const user = userSnapshot.val() as User;
    
    // Get the invitation details from the user's pending invitation
    if (!user.customization?.pendingInvitation) {
      throw new Error("No pending invitation found");
    }
    
    const invitation = user.customization.pendingInvitation;
    
    // Update user with company details
    const updatedCustomization = {
      ...user.customization,
      companyId: invitation.companyId,
      companyName: invitation.companyName,
      primaryColor: invitation.primaryColor,
      logo: invitation.logo,
      isCompanyMember: true,
      pendingInvitation: null  // Clear the pending invitation
    };
    
    await updateUser(userId, {
      customization: updatedCustomization
    });
    
    // Delete the invitation
    const invitationRef = ref(database, `companyInvitations/${invitationId}`);
    await set(invitationRef, null);
    
    // Return the updated user
    const updatedUserSnapshot = await get(userRef);
    return updatedUserSnapshot.val() as User;
  } catch (error) {
    console.error('Error accepting company invitation:', error);
    throw error;
  }
};

export const declineCompanyInvitation = async (invitationId: string, userId: string): Promise<User> => {
  try {
    // Get the user
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      throw new Error("User not found");
    }
    
    const user = userSnapshot.val() as User;
    
    // Update user to remove the pending invitation
    if (user.customization) {
      const updatedCustomization = {
        ...user.customization,
        pendingInvitation: null
      };
      
      await updateUser(userId, {
        customization: updatedCustomization
      });
    }
    
    // Delete the invitation
    const invitationRef = ref(database, `companyInvitations/${invitationId}`);
    await set(invitationRef, null);
    
    // Return the updated user
    const updatedUserSnapshot = await get(userRef);
    return updatedUserSnapshot.val() as User;
  } catch (error) {
    console.error('Error declining company invitation:', error);
    throw error;
  }
};

export const updateDashboardCustomization = async (userId: string, customization: Partial<User['customization']>): Promise<User> => {
  try {
    // Get current user
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error("User not found");
    }
    
    const user = snapshot.val() as User;
    
    // Update customization
    const updatedCustomization = {
      ...user.customization,
      ...customization
    };
    
    // Update user
    await update(userRef, {
      customization: updatedCustomization
    });
    
    // Return updated user
    const updatedSnapshot = await get(userRef);
    return updatedSnapshot.val() as User;
  } catch (error) {
    console.error("Error updating dashboard customization:", error);
    throw error;
  }
};

// Generate a company invite link
export const generateCompanyInviteLink = async (companyId: string): Promise<string> => {
  try {
    // Generate a unique invite code
    const inviteCode = `${companyId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the invite code in the database
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/companyInviteLinks/${inviteCode}.json`, {
      method: 'PUT',
      body: JSON.stringify({
        companyId,
        createdAt: new Date().toISOString(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiry
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate invite link');
    }
    
    // Return the full invite link
    const baseUrl = window.location.origin;
    return `${baseUrl}/join-company/${inviteCode}`;
  } catch (error) {
    console.error('Error generating company invite link:', error);
    throw error;
  }
};

// Join a company via invite link
export const joinCompanyViaLink = async (inviteCode: string, userId: string): Promise<boolean> => {
  try {
    // Fetch the invite details
    const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/companyInviteLinks/${inviteCode}.json`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch invite details');
    }
    
    const inviteData = await response.json();
    
    if (!inviteData) {
      throw new Error('Invalid invite code');
    }
    
    // Check if the invite is expired
    if (new Date(inviteData.expires) < new Date()) {
      throw new Error('This invite link has expired');
    }
    
    // Get the company data
    const company = await getCompanyById(inviteData.companyId);
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    // Add the user to the company
    const updateResponse = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/users/${userId}/customization.json`, {
      method: 'PATCH',
      body: JSON.stringify({
        companyId: inviteData.companyId
      }),
    });
    
    if (!updateResponse.ok) {
      throw new Error('Failed to join company');
    }
    
    return true;
  } catch (error) {
    console.error('Error joining company via invite link:', error);
    throw error;
  }
};
