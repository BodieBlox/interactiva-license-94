
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAuditLogs, AuditLogEntry } from '@/utils/auditLog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ClipboardList, Search, Filter, UserCheck, Shield, Settings, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { database } from '@/utils/firebase';
import { ref, onValue, off, query, orderByChild } from 'firebase/database';

export const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    // Create a reference to the audit logs in the database
    const auditLogsRef = ref(database, 'auditLogs');
    const auditLogsQuery = query(auditLogsRef, orderByChild('timestamp'));
    
    // Listen for changes to the audit logs
    onValue(auditLogsQuery, (snapshot) => {
      const logsData: AuditLogEntry[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const log = childSnapshot.val();
        logsData.push({
          id: childSnapshot.key || undefined,
          ...log
        });
      });
      
      // Sort logs by timestamp (most recent first)
      const sortedLogs = logsData.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });
      
      setLogs(sortedLogs);
      setFilteredLogs(sortedLogs);
      setIsLoading(false);
    });
    
    // Clean up listener when component unmounts
    return () => {
      off(auditLogsRef);
    };
  }, []);

  // Filter logs when search query or action filter changes
  useEffect(() => {
    let filtered = logs;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        (log.username && log.username.toLowerCase().includes(query)) ||
        (log.action && log.action.toLowerCase().includes(query)) ||
        (log.details && log.details.toLowerCase().includes(query))
      );
    }
    
    // Filter by action type
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action.toLowerCase().includes(actionFilter.toLowerCase()));
    }
    
    setFilteredLogs(filtered);
  }, [logs, searchQuery, actionFilter]);

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return <UserCheck className="h-4 w-4" />;
    if (action.includes('license')) return <Shield className="h-4 w-4" />;
    if (action.includes('settings')) return <Settings className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };
  
  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes('create') || action.includes('add')) return "default";
    if (action.includes('update') || action.includes('modify')) return "secondary";
    if (action.includes('delete') || action.includes('remove') || action.includes('suspend')) return "destructive";
    return "outline";
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    // If timestamp is a Firebase server timestamp object
    if (timestamp && typeof timestamp === 'object' && timestamp.hasOwnProperty('.sv')) {
      return 'Just now';
    }
    
    let date;
    try {
      // Try to convert to Date object
      date = new Date(timestamp);
      return format(date, 'MMM dd, yyyy HH:mm:ss');
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span>Audit Logs</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-[200px]"
              />
            </div>
            <Select
              value={actionFilter}
              onValueChange={setActionFilter}
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="user">User Actions</SelectItem>
                <SelectItem value="license">License Actions</SelectItem>
                <SelectItem value="login">Login Actions</SelectItem>
                <SelectItem value="company">Company Actions</SelectItem>
                <SelectItem value="settings">Settings Actions</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9"
              onClick={() => {
                setSearchQuery('');
                setActionFilter('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-1/6">Timestamp</TableHead>
                    <TableHead className="w-1/6">User</TableHead>
                    <TableHead className="w-1/6">Action</TableHead>
                    <TableHead className="w-2/6">Details</TableHead>
                    <TableHead className="w-1/6">Resource</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardList className="h-8 w-8 text-muted-foreground/30" />
                          <p className="text-muted-foreground">No audit logs found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <TableRow key={log.id || index} className="animate-fade-in" style={{ animationDelay: `${index * 0.03}s` }}>
                        <TableCell className="font-mono text-xs">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{log.username || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)} className="flex items-center gap-1 whitespace-nowrap">
                            {getActionIcon(log.action)}
                            <span>{log.action}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {log.details || 'No details provided'}
                        </TableCell>
                        <TableCell>
                          {log.resourceType && (
                            <div className="flex items-center gap-1">
                              <span className="capitalize">{log.resourceType}</span>
                              {log.resourceId && <span className="text-xs text-muted-foreground">({log.resourceId.substring(0, 8)}...)</span>}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
