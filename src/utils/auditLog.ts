
import { auth, database } from './firebase';
import { ref, push, serverTimestamp } from 'firebase/database';

export interface AuditLogEntry {
  id?: string; // Adding optional id field
  userId?: string;
  username?: string;
  action: string;
  timestamp?: any;
  details?: string;
  resourceId?: string;
  resourceType?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Log an admin action to the audit log
 */
export const logAdminAction = async (entry: AuditLogEntry): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.warn('No authenticated user found when logging action');
      return;
    }
    
    const auditLogRef = ref(database, 'auditLogs');
    
    // Create the audit log entry with user information
    const logEntry: AuditLogEntry = {
      ...entry,
      userId: currentUser.uid,
      username: currentUser.displayName || currentUser.email || 'Unknown user',
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    };
    
    // Push the entry to the audit logs collection
    await push(auditLogRef, logEntry);
    
    console.log('Audit log entry created:', logEntry.action);
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

/**
 * Get audit logs with optional filtering
 */
export const getAuditLogs = async (filters?: {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<AuditLogEntry[]> => {
  // This would be implemented with Firebase queries in a real application
  // For now, we'll just log that this was called
  console.log('Getting audit logs with filters:', filters);
  return [];
};
