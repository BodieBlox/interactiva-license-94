
import { database } from './firebase';
import { ref, get, push, set, update } from 'firebase/database';
import { User, CompanyInvitation } from './types';
import { updateUser } from './api';

// Company invitation functions
export const sendCompanyInvitation = async (
  fromUserId: string,
  toUserId: string,
  companyName: string,
  companyId: string,
  primaryColor?: string,
  logo?: string
): Promise<void> => {
  try {
    // Create invitation
    const invitation: CompanyInvitation = {
      fromUserId,
      fromUsername: '',  // Will be updated with the actual username
      companyName,
      companyId,
      timestamp: new Date().toISOString(),
      primaryColor,
      logo
    };
    
    // Get the from user to include their username
    const fromUserRef = ref(database, `users/${fromUserId}`);
    const fromUserSnapshot = await get(fromUserRef);
    if (fromUserSnapshot.exists()) {
      const fromUser = fromUserSnapshot.val() as User;
      invitation.fromUsername = fromUser.username;
    }
    
    // Create a unique ID for the invitation
    const invitationsRef = ref(database, 'companyInvitations');
    const newInvitationRef = push(invitationsRef);
    invitation.id = newInvitationRef.key;
    
    // Save the invitation
    await set(newInvitationRef, invitation);
    
    // Add the invitation to the receiver's user record
    await updateUser(toUserId, {
      customization: {
        pendingInvitation: invitation
      }
    });
  } catch (error) {
    console.error('Error sending company invitation:', error);
    throw error;
  }
};

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
