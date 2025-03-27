
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuditLogEntry, getAuditLogs } from '@/utils/auditLog';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '@/utils/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');

  useEffect(() => {
    const auditLogsRef = query(
      ref(database, 'auditLogs'),
      orderByChild('timestamp'),
      limitToLast(100)
    );

    const unsubscribe = onValue(auditLogsRef, (snapshot) => {
      const logsData: AuditLogEntry[] = [];
      snapshot.forEach((childSnapshot) => {
        const log = childSnapshot.val();
        logsData.push({
          id: childSnapshot.key,
          ...log
        });
      });
      
      // Sort logs by timestamp, newest first
      logsData.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return b.timestamp - a.timestamp;
      });
      
      setLogs(logsData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching audit logs:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter logs based on search query and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      !searchQuery || 
      log.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesResource = !resourceFilter || log.resourceType === resourceFilter;
    
    return matchesSearch && matchesAction && matchesResource;
  });

  // Get unique action types for filter
  const actionTypes = Array.from(new Set(logs.map(log => log.action))).sort();
  
  // Get unique resource types for filter
  const resourceTypes = Array.from(new Set(logs.map(log => log.resourceType).filter(Boolean))).sort();

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      // If it's a Firebase timestamp, convert to Date
      const date = new Date(typeof timestamp === 'number' ? timestamp : timestamp.toDate());
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Audit Logs</CardTitle>
          <CardDescription>Track all administrative actions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:w-1/3"
            />
            
            <div className="flex gap-2 flex-1">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Filter by resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All resources</SelectItem>
                  {resourceTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setActionFilter('');
                  setResourceFilter('');
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium">No audit logs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || actionFilter || resourceFilter
                  ? "No logs match your search criteria."
                  : "There are no audit logs in the system yet."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log, index) => (
                  <TableRow key={log.id || index}>
                    <TableCell className="whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>{log.username || 'Unknown'}</TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.resourceType ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {log.resourceType}
                          {log.resourceId && <span className="ml-1 opacity-75">#{log.resourceId.slice(0, 6)}</span>}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {log.details || 'No details provided'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
