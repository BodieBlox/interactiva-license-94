
import { useState, useEffect } from 'react';
import { LoginLog } from '@/utils/types';
import { getLoginLogs, getUsers, forceUserLogout } from '@/utils/api';
import { 
  Table, TableHeader, TableBody, TableHead, 
  TableRow, TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Search, RefreshCw, LogOut, UserX, 
  Shield, Calendar, Globe, Monitor 
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format, isValid } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const LoginLogs = () => {
  const [logs, setLogs] = useState<(LoginLog & { username?: string })[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<(LoginLog & { username?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchLogs();
  }, []);
  
  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching login logs...");
      const allLogs = await getLoginLogs();
      console.log("Logs received:", allLogs);
      
      const allUsers = await getUsers();
      console.log("Users received:", allUsers);
      
      // Add username to each log
      const logsWithUsername = allLogs.map(log => {
        const user = allUsers.find(u => u.id === log.userId);
        return {
          ...log,
          username: user?.username
        };
      });
      
      // Sort by timestamp, most recent first
      const sortedLogs = logsWithUsername.sort((a, b) => {
        // Safely parse timestamps
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        
        // Check if dates are valid before comparing
        if (!isValid(dateA) && !isValid(dateB)) return 0;
        if (!isValid(dateA)) return 1;
        if (!isValid(dateB)) return -1;
        
        return dateB.getTime() - dateA.getTime();
      });
      
      setLogs(sortedLogs);
      setFilteredLogs(sortedLogs);
    } catch (error) {
      console.error('Error fetching login logs:', error);
      setError("Failed to load login logs. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load login logs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = logs.filter(log => 
        (log.username?.toLowerCase().includes(query)) ||
        log.ip.includes(query) ||
        log.userAgent.toLowerCase().includes(query)
      );
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs(logs);
    }
  }, [searchQuery, logs]);
  
  const handleForceLogout = async () => {
    if (!selectedUserId) return;
    
    setIsProcessing(true);
    try {
      await forceUserLogout(selectedUserId);
      toast({
        title: "Success",
        description: "User has been forced to log out",
        variant: "success"
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Error forcing logout:', error);
      toast({
        title: "Error",
        description: `Failed to force logout: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRefresh = () => {
    fetchLogs();
  };

  // Helper function to safely format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isValid(date)) {
        return format(date, 'PPpp');
      } else {
        return "Invalid date";
      }
    } catch (error) {
      console.warn(`Error formatting date: ${dateString}`, error);
      return "Invalid date";
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="animate-fade-in">
        <Card variant="glass" className="mb-6 p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="text-red-500">
              <Shield className="h-10 w-10 mx-auto" />
            </div>
            <div>
              <h2 className="text-xl font-medium mb-1">Error Loading Login Logs</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={handleRefresh} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      <Card variant="glass" className="mb-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full sm:w-auto">
            <h2 className="text-xl font-medium mb-1 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Login Activity
            </h2>
            <p className="text-sm text-muted-foreground">Monitor user login activity and IP addresses</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 transition-all duration-300 focus:ring-2 focus:ring-primary/30 w-full"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center gap-2 transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </Card>
      
      <Card className="glass-panel border-0 animate-scale-in">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <LogOut className="h-8 w-8 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No login activity found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log, index) => (
                  <TableRow 
                    key={log.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <TableCell className="font-medium">{log.username || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>{log.ip}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate" title={log.userAgent}>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{log.userAgent}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(log.userId);
                          setDialogOpen(true);
                        }}
                        className="flex items-center gap-1 text-red-500 border-red-200 hover:bg-red-50"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        <span>Force Logout</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md glass-panel border-0 animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-500" />
              <span>Force User Logout</span>
            </DialogTitle>
            <DialogDescription>
              This will force the user to log out of all active sessions. They will need to log in again.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="transition-all duration-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleForceLogout}
              disabled={isProcessing}
              className="bg-red-500 hover:bg-red-600 transition-all duration-300"
            >
              {isProcessing ? (
                <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              ) : (
                'Force Logout'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
