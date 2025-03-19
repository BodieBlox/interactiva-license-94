
import { useState, useEffect } from 'react';
import { User } from '@/utils/types';
import { getUsers, approveDashboardCustomization } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, PaintBucket } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

export const BrandingApproval = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await getUsers();
        setUsers(allUsers);
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

  const handleApprove = async (userId: string) => {
    setIsApproving(userId);
    try {
      const updatedUser = await approveDashboardCustomization(userId);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? updatedUser 
            : user
        )
      );
      
      toast({
        title: "Success",
        description: "Branding customization approved",
        variant: "success"
      });
    } catch (error) {
      console.error('Error approving customization:', error);
      toast({
        title: "Error",
        description: `Failed to approve customization: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsApproving(null);
    }
  };

  // Filter users who have customization settings that are not approved
  const pendingUsers = users.filter(user => 
    user.customization && user.customization.approved === false
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Card className="glass-panel border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PaintBucket className="h-5 w-5 text-primary" />
            <span>Branding Approval Requests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No pending branding approval requests
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map(user => (
                <Card key={user.id} className="overflow-hidden">
                  <div className="p-4 border-b bg-muted/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{user.username}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge>Pending Approval</Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Company Name</p>
                        <p className="text-sm">{user.customization?.companyName || 'Not specified'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Brand Color</p>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-md border"
                            style={{ backgroundColor: user.customization?.primaryColor || '#7E69AB' }}
                          ></div>
                          <span className="text-sm">{user.customization?.primaryColor || '#7E69AB'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Logo URL</p>
                        <p className="text-sm break-all">{user.customization?.logo || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                        onClick={() => handleApprove(user.id)}
                        disabled={isApproving === user.id}
                      >
                        {isApproving === user.id ? (
                          <div className="h-4 w-4 rounded-full border-2 border-t-green-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
