
import { Company, CompanyInvitation, UserWithCompany, CompanyMember } from './companyTypes';
import { database } from './firebase';
import { ref, set, get, push, remove, update } from 'firebase/database';

// Company management
export const createCompany = async (companyData: Partial<Company>, userId: string): Promise<Company> => {
  console.log('Creating company with data:', companyData);
  
  const companyRef = push(ref(database, 'companies'));
  const companyId = companyRef.key;
  
  if (!companyId) {
    throw new Error('Failed to generate company ID');
  }
  
  const newCompany: Company = {
    id: companyId,
    name: companyData.name || 'New Company',
    adminId: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    branding: {
      primaryColor: companyData.branding?.primaryColor || '#646cff',
      approved: userId.includes('admin'), // Auto-approve for admins
      ...companyData.branding
    },
    members: [userId]
  };
  
  await set(ref(database, `companies/${companyId}`), newCompany);
  
  // Add user as company admin
  await set(ref(database, `companyMembers/${companyId}/${userId}`), {
    userId: userId,
    companyId: companyId,
    role: 'admin',
    joinedAt: new Date().toISOString(),
    invitedBy: userId
  });
  
  return newCompany;
};

export const getCompanies = async (): Promise<Company[]> => {
  console.log('Fetching all companies');
  
  const companiesRef = ref(database, 'companies');
  const snapshot = await get(companiesRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const companies: Company[] = [];
  snapshot.forEach((childSnapshot) => {
    companies.push(childSnapshot.val() as Company);
  });
  
  return companies;
};

export const getCompanyById = async (companyId: string): Promise<Company | null> => {
  console.log('Fetching company by ID:', companyId);
  
  const companyRef = ref(database, `companies/${companyId}`);
  const snapshot = await get(companyRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return snapshot.val() as Company;
};

export const updateCompany = async (companyId: string, companyData: Partial<Company>): Promise<Company> => {
  console.log('Updating company:', companyId, companyData);
  
  // First get the current company data
  const companyRef = ref(database, `companies/${companyId}`);
  const snapshot = await get(companyRef);
  
  if (!snapshot.exists()) {
    throw new Error(`Company with ID ${companyId} not found`);
  }
  
  const currentCompany = snapshot.val() as Company;
  const updatedCompany = {
    ...currentCompany,
    ...companyData,
    updatedAt: new Date().toISOString()
  };
  
  // Don't override members array if not provided
  if (!companyData.members) {
    updatedCompany.members = currentCompany.members;
  }
  
  // Don't override branding if not provided
  if (!companyData.branding) {
    updatedCompany.branding = currentCompany.branding;
  } else {
    updatedCompany.branding = {
      ...currentCompany.branding,
      ...companyData.branding
    };
  }
  
  await update(companyRef, updatedCompany);
  return updatedCompany;
};

export const deleteCompany = async (companyId: string): Promise<boolean> => {
  console.log('Deleting company:', companyId);
  
  // Delete company
  await remove(ref(database, `companies/${companyId}`));
  
  // Delete all company members
  await remove(ref(database, `companyMembers/${companyId}`));
  
  // Delete all company invitations
  const invitationsRef = ref(database, 'companyInvitations');
  const snapshot = await get(invitationsRef);
  
  if (snapshot.exists()) {
    const updates: Record<string, null> = {};
    
    snapshot.forEach((childSnapshot) => {
      const invitation = childSnapshot.val() as CompanyInvitation;
      if (invitation.companyId === companyId) {
        updates[`companyInvitations/${childSnapshot.key}`] = null;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
    }
  }
  
  return true;
};

// Company membership
export const getCompanyMembers = async (companyId: string): Promise<UserWithCompany[]> => {
  console.log('Fetching members for company:', companyId);
  
  const membersRef = ref(database, `companyMembers/${companyId}`);
  const snapshot = await get(membersRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const memberIds: string[] = [];
  const memberRoles: Record<string, 'admin' | 'member'> = {};
  
  snapshot.forEach((childSnapshot) => {
    const member = childSnapshot.val() as CompanyMember;
    memberIds.push(member.userId);
    memberRoles[member.userId] = member.role;
  });
  
  // Now fetch the user data for these members
  const usersRef = ref(database, 'users');
  const usersSnapshot = await get(usersRef);
  
  if (!usersSnapshot.exists()) {
    return [];
  }
  
  const companyRef = ref(database, `companies/${companyId}`);
  const companySnapshot = await get(companyRef);
  
  if (!companySnapshot.exists()) {
    return [];
  }
  
  const company = companySnapshot.val() as Company;
  const members: UserWithCompany[] = [];
  
  usersSnapshot.forEach((childSnapshot) => {
    const user = childSnapshot.val();
    if (memberIds.includes(user.id)) {
      members.push({
        ...user,
        company: {
          id: companyId,
          name: company.name,
          role: memberRoles[user.id],
          branding: company.branding
        }
      });
    }
  });
  
  return members;
};

export const addCompanyMember = async (companyId: string, userId: string, role: 'admin' | 'member'): Promise<boolean> => {
  console.log('Adding member to company:', companyId, userId, role);
  
  // Check if company exists
  const companyRef = ref(database, `companies/${companyId}`);
  const companySnapshot = await get(companyRef);
  
  if (!companySnapshot.exists()) {
    throw new Error(`Company with ID ${companyId} not found`);
  }
  
  const company = companySnapshot.val() as Company;
  
  // Add member to company members list
  await set(ref(database, `companyMembers/${companyId}/${userId}`), {
    userId: userId,
    companyId: companyId,
    role: role,
    joinedAt: new Date().toISOString(),
    invitedBy: company.adminId
  });
  
  // Update company members array
  if (!company.members.includes(userId)) {
    company.members.push(userId);
    await update(companyRef, { members: company.members });
  }
  
  return true;
};

export const removeCompanyMember = async (companyId: string, userId: string): Promise<boolean> => {
  console.log('Removing member from company:', companyId, userId);
  
  // Remove from company members
  await remove(ref(database, `companyMembers/${companyId}/${userId}`));
  
  // Update company members array
  const companyRef = ref(database, `companies/${companyId}`);
  const companySnapshot = await get(companyRef);
  
  if (companySnapshot.exists()) {
    const company = companySnapshot.val() as Company;
    const updatedMembers = company.members.filter(id => id !== userId);
    await update(companyRef, { members: updatedMembers });
  }
  
  return true;
};

export const updateMemberRole = async (companyId: string, userId: string, role: 'admin' | 'member'): Promise<boolean> => {
  console.log('Updating member role:', companyId, userId, role);
  
  await update(ref(database, `companyMembers/${companyId}/${userId}`), { role });
  return true;
};

// Company invitations
export const sendCompanyInvitation = async (invitation: Partial<CompanyInvitation>): Promise<CompanyInvitation> => {
  console.log('Sending company invitation:', invitation);
  
  const invitationRef = push(ref(database, 'companyInvitations'));
  const invitationId = invitationRef.key;
  
  if (!invitationId) {
    throw new Error('Failed to generate invitation ID');
  }
  
  const newInvitation: CompanyInvitation = {
    id: invitationId,
    fromUserId: invitation.fromUserId || '',
    fromUsername: invitation.fromUsername || '',
    companyId: invitation.companyId || '',
    companyName: invitation.companyName || '',
    toUserId: invitation.toUserId || '',
    toEmail: invitation.toEmail || '',
    status: 'pending',
    timestamp: new Date().toISOString(),
    primaryColor: invitation.primaryColor
  };
  
  await set(invitationRef, newInvitation);
  return newInvitation;
};

export const getCompanyInvitationsByUser = async (userId: string): Promise<CompanyInvitation[]> => {
  console.log('Fetching invitations for user:', userId);
  
  const invitationsRef = ref(database, 'companyInvitations');
  const snapshot = await get(invitationsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const invitations: CompanyInvitation[] = [];
  
  snapshot.forEach((childSnapshot) => {
    const invitation = childSnapshot.val() as CompanyInvitation;
    if (invitation.toUserId === userId && invitation.status === 'pending') {
      invitations.push(invitation);
    }
  });
  
  return invitations;
};

export const acceptCompanyInvitation = async (invitationId: string, userId: string): Promise<boolean> => {
  console.log('Accepting invitation:', invitationId, userId);
  
  const invitationRef = ref(database, `companyInvitations/${invitationId}`);
  const snapshot = await get(invitationRef);
  
  if (!snapshot.exists()) {
    throw new Error(`Invitation with ID ${invitationId} not found`);
  }
  
  const invitation = snapshot.val() as CompanyInvitation;
  
  // Update invitation status
  await update(invitationRef, { status: 'accepted' });
  
  // Add user to company
  await addCompanyMember(invitation.companyId, userId, 'member');
  
  return true;
};

export const declineCompanyInvitation = async (invitationId: string, userId: string): Promise<boolean> => {
  console.log('Declining invitation:', invitationId, userId);
  
  const invitationRef = ref(database, `companyInvitations/${invitationId}`);
  const snapshot = await get(invitationRef);
  
  if (!snapshot.exists()) {
    throw new Error(`Invitation with ID ${invitationId} not found`);
  }
  
  // Update invitation status
  await update(invitationRef, { status: 'declined' });
  
  return true;
};
