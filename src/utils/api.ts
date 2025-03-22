import { User, DashboardCustomization, License, LicenseRequest } from './types';
import { database } from './firebase';
import { ref, set, get, push, remove, update } from 'firebase/database';

export const getUsers = async (): Promise<User[]> => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);

  if (snapshot.exists()) {
    const users: User[] = [];
    snapshot.forEach((childSnapshot) => {
      users.push(childSnapshot.val() as User);
    });
    return users;
  } else {
    return [];
  }
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = ref(database, `users/${userId}`);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    return snapshot.val() as User;
  } else {
    return null;
  }
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<User> => {
  const userRef = ref(database, `users/${userId}`);
  await update(userRef, data);

  // Fetch the updated user data
  const updatedUserSnapshot = await get(userRef);
  if (updatedUserSnapshot.exists()) {
    return updatedUserSnapshot.val() as User;
  } else {
    throw new Error('Failed to fetch updated user data');
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  const userRef = ref(database, `users/${userId}`);
  await remove(userRef);
};

export const createLicense = async (licenseData: License): Promise<License> => {
  const licenseRef = ref(database, `licenses/${licenseData.id}`);
  await set(licenseRef, licenseData);
  return licenseData;
};

export const getLicense = async (licenseId: string): Promise<License | null> => {
  const licenseRef = ref(database, `licenses/${licenseId}`);
  const snapshot = await get(licenseRef);

  if (snapshot.exists()) {
    return snapshot.val() as License;
  } else {
    return null;
  }
};

export const updateLicense = async (licenseId: string, data: Partial<License>): Promise<License> => {
  const licenseRef = ref(database, `licenses/${licenseId}`);
  await update(licenseRef, data);

  // Fetch the updated license data
  const updatedLicenseSnapshot = await get(licenseRef);
  if (updatedLicenseSnapshot.exists()) {
    return updatedLicenseSnapshot.val() as License;
  } else {
    throw new Error('Failed to fetch updated license data');
  }
};

export const getLicenses = async (): Promise<License[]> => {
  const licensesRef = ref(database, 'licenses');
  const snapshot = await get(licensesRef);

  if (snapshot.exists()) {
    const licenses: License[] = [];
    snapshot.forEach((childSnapshot) => {
      licenses.push(childSnapshot.val() as License);
    });
    return licenses;
  } else {
    return [];
  }
};

export const createLicenseRequest = async (requestData: LicenseRequest): Promise<LicenseRequest> => {
  const requestRef = push(ref(database, 'licenseRequests'), requestData);
  const requestId = requestRef.key;

  if (!requestId) {
    throw new Error('Failed to generate request ID');
  }

  // Set the request ID in the object
  const newRequestData = { ...requestData, id: requestId };
  await set(ref(database, `licenseRequests/${requestId}`), newRequestData);
  return newRequestData;
};

export const getLicenseRequests = async (): Promise<LicenseRequest[]> => {
  const requestsRef = ref(database, 'licenseRequests');
  const snapshot = await get(requestsRef);

  if (snapshot.exists()) {
    const requests: LicenseRequest[] = [];
    snapshot.forEach((childSnapshot) => {
      requests.push(childSnapshot.val() as LicenseRequest);
    });
    return requests;
  } else {
    return [];
  }
};

export const getLicenseRequest = async (requestId: string): Promise<LicenseRequest | null> => {
  const requestRef = ref(database, `licenseRequests/${requestId}`);
  const snapshot = await get(requestRef);

  if (snapshot.exists()) {
    return snapshot.val() as LicenseRequest;
  } else {
    return null;
  }
};

export const updateLicenseRequest = async (requestId: string, data: Partial<LicenseRequest>): Promise<LicenseRequest> => {
  const requestRef = ref(database, `licenseRequests/${requestId}`);
  await update(requestRef, data);

  // Fetch the updated request data
  const updatedRequestSnapshot = await get(requestRef);
  if (updatedRequestSnapshot.exists()) {
    return updatedRequestSnapshot.val() as LicenseRequest;
  } else {
    throw new Error('Failed to fetch updated license request data');
  }
};

export const deleteLicenseRequest = async (requestId: string): Promise<void> => {
  const requestRef = ref(database, `licenseRequests/${requestId}`);
  await remove(requestRef);
};

export const updateDashboardCustomization = async (userId: string, customization: DashboardCustomization): Promise<User> => {
  const userRef = ref(database, `users/${userId}/customization`);
  await update(userRef, customization);

  // Fetch the updated user data
  const updatedUserSnapshot = await get(ref(database, `users/${userId}`));
  if (updatedUserSnapshot.exists()) {
    return updatedUserSnapshot.val() as User;
  } else {
    throw new Error('Failed to fetch updated user data');
  }
};

export const approveLicenseRequest = async (requestId: string) => {
  try {
    const requestRef = ref(database, `licenseRequests/${requestId}`);
    const snapshot = await get(requestRef);

    if (!snapshot.exists()) {
      throw new Error('License request not found');
    }

    const request = snapshot.val() as LicenseRequest;
    const { userId, requestType } = request;

    // Get current user data
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      throw new Error('User not found');
    }
    
    const user = userSnapshot.val() as User;
    const updates: Record<string, any> = {};
    
    // Update the request status
    updates[`licenseRequests/${requestId}/status`] = 'approved';
    updates[`licenseRequests/${requestId}/resolvedAt`] = new Date().toISOString();
    
    // Handle extension - extend current license by 30 days
    if (requestType === 'extension') {
      const currentExpiry = user.licenseExpiryDate 
        ? new Date(user.licenseExpiryDate)
        : new Date();
      
      // Add 30 days to current expiry
      const newExpiryDate = new Date(currentExpiry);
      newExpiryDate.setDate(newExpiryDate.getDate() + 30);
      
      // Update user's license expiry date
      updates[`users/${userId}/licenseExpiryDate`] = newExpiryDate.toISOString();
      updates[`users/${userId}/licenseActive`] = true;
      
      // If they had a license, also update the license record
      if (user.licenseId) {
        updates[`licenses/${user.licenseId}/expiresAt`] = newExpiryDate.toISOString();
        updates[`licenses/${user.licenseId}/status`] = 'active';
      }
    }
    
    // Handle upgrade - change license type to premium or enterprise
    if (requestType === 'upgrade') {
      // Default to premium upgrade unless they're already premium
      let newType: 'basic' | 'premium' | 'enterprise' = 'premium';
      
      // If they're already premium, upgrade to enterprise
      if (user.licenseType === 'premium') {
        newType = 'enterprise';
      }
      
      // Update user license type
      updates[`users/${userId}/licenseType`] = newType;
      updates[`users/${userId}/licenseActive`] = true;
      
      // Also ensure expiry date is set if not already
      if (!user.licenseExpiryDate) {
        const newExpiryDate = new Date();
        newExpiryDate.setDate(newExpiryDate.getDate() + 30);
        updates[`users/${userId}/licenseExpiryDate`] = newExpiryDate.toISOString();
      }
      
      // If they had a license, also update the license record
      if (user.licenseId) {
        updates[`licenses/${user.licenseId}/type`] = newType;
        updates[`licenses/${user.licenseId}/status`] = 'active';
      }
    }
    
    // Apply all updates atomically
    await update(ref(database), updates);
    
    return { success: true, message: 'License request approved' };
  } catch (error) {
    console.error('Error approving license request:', error);
    throw error;
  }
};

export const rejectLicenseRequest = async (requestId: string, reason: string) => {
  try {
    const updates: Record<string, any> = {};

    // Update the request status to 'rejected'
    updates[`licenseRequests/${requestId}/status`] = 'rejected';
    updates[`licenseRequests/${requestId}/resolvedAt`] = new Date().toISOString();
    updates[`licenseRequests/${requestId}/rejectionReason`] = reason;

    await update(ref(database), updates);

    return { success: true, message: 'License request rejected' };
  } catch (error) {
    console.error('Error rejecting license request:', error);
    throw error;
  }
};
