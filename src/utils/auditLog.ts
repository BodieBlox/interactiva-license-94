
import { auth, database } from './firebase';
import { ref, push, serverTimestamp, get, query, orderByChild } from 'firebase/database';

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
  try {
    const auditLogsRef = ref(database, 'auditLogs');
    let auditLogsQuery;
    
    // If we have filters, apply them
    if (filters) {
      // For now, we're just ordering by timestamp
      // In a real app, you'd implement filtering based on the filters object
      auditLogsQuery = query(auditLogsRef, orderByChild('timestamp'));
    } else {
      auditLogsQuery = query(auditLogsRef, orderByChild('timestamp'));
    }
    
    const snapshot = await get(auditLogsQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const logs: AuditLogEntry[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const log = childSnapshot.val();
      logs.push({
        id: childSnapshot.key || undefined,
        ...log
      });
    });
    
    // Sort by timestamp (most recent first)
    return logs.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};
