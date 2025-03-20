
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { generateLicense, getAllUsers, assignLicenseToUser } from '@/utils/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Key, UserCog, UserCheck, Calendar, Infinity } from 'lucide-react';
import { User } from '@/utils/types';

export default function ManualLicenseAssignment() {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [licenseType, setLicenseType] = useState('standard');
  const [expirationDays, setExpirationDays] = useState(30);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showExpiration, setShowExpiration] = useState(true);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers
  });

  const handleAssignLicense = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    try {
      // Generate a new license with type and expiration based on form values
      const licenseResult = await generateLicense({
        type: licenseType,
        expirationDays: showExpiration ? expirationDays : null
      });
      
      // Now assign the license to the user
      await assignLicenseToUser(selectedUserId, licenseResult.key);
      
      toast({
        title: "License Assigned",
        description: `A ${showExpiration ? 'temporary' : 'permanent'} ${licenseType} license has been assigned to the user`,
        variant: "success"
      });
      
      // Reset the form
      setSelectedUserId('');
    } catch (error) {
      console.error('Error assigning license:', error);
      toast({
        title: "Error",
        description: `Failed to assign license to user: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manual License Assignment</CardTitle>
          <CardDescription>
            Assign licenses directly to users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userSelect">Select User</Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={usersLoading}
            >
              <SelectTrigger id="userSelect">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {usersLoading ? (
                  <SelectItem value="loading" disabled>Loading users...</SelectItem>
                ) : (
                  users?.map((user: User) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="licenseType">License Type</Label>
            <Select
              value={licenseType}
              onValueChange={setLicenseType}
            >
              <SelectTrigger id="licenseType">
                <SelectValue placeholder="Select license type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="expiration-mode"
              checked={showExpiration}
              onCheckedChange={setShowExpiration}
            />
            <Label htmlFor="expiration-mode" className="flex items-center gap-2">
              {showExpiration ? (
                <>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Set Expiration Period</span>
                </>
              ) : (
                <>
                  <Infinity className="h-4 w-4 text-muted-foreground" />
                  <span>Perpetual License (No Expiration)</span>
                </>
              )}
            </Label>
          </div>
          
          {showExpiration && (
            <div className="space-y-2">
              <Label htmlFor="expirationDays">Expiration Period (days)</Label>
              <Input 
                id="expirationDays"
                type="number" 
                min="1"
                value={expirationDays} 
                onChange={(e) => setExpirationDays(parseInt(e.target.value))}
              />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleAssignLicense} 
            className="w-full"
            disabled={isAssigning || !selectedUserId}
          >
            {isAssigning ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-white" />
                Assigning License...
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Assign License
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
