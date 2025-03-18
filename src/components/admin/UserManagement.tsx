
import { useState, useEffect } from 'react';
import { User } from '@/utils/types';
import { getUsers, updateUserStatus } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Ban, CheckCircle, Search, ShieldAlert, UserCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'warn' | 'suspend' | 'activate' | null>(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await getUsers();
        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleOpenDialog = (user: User, type: 'warn' | 'suspend' | 'activate') => {
    setSelectedUser(user);
    setActionType(type);
    setWarningMessage(type === 'activate' ? '' : user.warningMessage || '');
    setDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;
    
    try {
      let status: User['status'];
      
      switch (actionType) {
        case 'warn':
          status = 'warned';
          break;
        case 'suspend':
          status = 'suspended';
          break;
        case 'activate':
          status = 'active';
          break;
        default:
          return;
      }
      
      const message = actionType !== 'activate' ? warningMessage.trim() : undefined;
      const updatedUser = await updateUserStatus(selectedUser.id, status, message);
      
      // Update the local state
      setUsers(prevUsers => prevUsers.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      
      toast({
        title: "Success",
        description: `User ${updatedUser.username} has been ${actionType}${actionType === 'activate' ? 'd' : 'ed'}`,
      });
      
      setDialogOpen(false);
      
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const renderStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'warned':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Warned</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="border-red-500 text-red-500">Suspended</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="glass-panel border-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Username</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">License</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-apple">
                      <td className="p-4">{user.username}</td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">{renderStatusBadge(user.status)}</td>
                      <td className="p-4">
                        {user.licenseActive ? (
                          <Badge variant="default" className="bg-primary">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="capitalize">{user.role}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {user.status === 'active' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenDialog(user, 'warn')}
                              className="flex items-center gap-1"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>Warn</span>
                            </Button>
                          )}
                          {user.status !== 'suspended' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenDialog(user, 'suspend')}
                              className="flex items-center gap-1 text-red-500 border-red-200 hover:bg-red-50"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              <span>Suspend</span>
                            </Button>
                          )}
                          {user.status !== 'active' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenDialog(user, 'activate')}
                              className="flex items-center gap-1 text-green-500 border-green-200 hover:bg-green-50"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Activate</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md glass-panel border-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'warn' && (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              {actionType === 'suspend' && (
                <ShieldAlert className="h-5 w-5 text-red-500" />
              )}
              {actionType === 'activate' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <span>
                {actionType === 'warn' && 'Issue Warning'}
                {actionType === 'suspend' && 'Suspend User'}
                {actionType === 'activate' && 'Activate User'}
              </span>
            </DialogTitle>
            <DialogDescription>
              {actionType === 'warn' && 'Send a warning to this user. They will see it on their next login.'}
              {actionType === 'suspend' && 'Suspend this user\'s account. They will be unable to use the system.'}
              {actionType === 'activate' && `Restore full access for ${selectedUser?.username}.`}
            </DialogDescription>
          </DialogHeader>
          
          {(actionType === 'warn' || actionType === 'suspend') && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="warningMessage">Message to user</Label>
                <Textarea
                  id="warningMessage"
                  placeholder="Enter reason for warning/suspension..."
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              className={
                actionType === 'warn' 
                  ? 'bg-amber-500 hover:bg-amber-600' 
                  : actionType === 'suspend'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
              }
              disabled={(actionType === 'warn' || actionType === 'suspend') && !warningMessage.trim()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
