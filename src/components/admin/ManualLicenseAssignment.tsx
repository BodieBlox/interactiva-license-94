
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserByEmail, createLicenseWithExpiry } from '@/utils/api';
import { Key, Search, User, UserCheck } from 'lucide-react';

export const ManualLicenseAssignment = () => {
  const [email, setEmail] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);

  const handleSearch = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const user = await getUserByEmail(email);
      if (user) {
        setFoundUser(user);
      } else {
        toast({
          title: "User not found",
          description: "No user exists with that email address",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      toast({
        title: "Error",
        description: "Failed to search for user",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssignLicense = async () => {
    if (!foundUser) {
      toast({
        title: "Error",
        description: "Search for a user first",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    try {
      // Create a new license with optional expiry date
      const expiryISODate = expiryDate ? new Date(expiryDate).toISOString() : undefined;
      const newLicense = await createLicenseWithExpiry(expiryISODate);
      
      toast({
        title: "License Created",
        description: `New license (${newLicense.key}) created for ${foundUser.username}`,
        variant: "success"
      });
      
      // Reset form after successful license creation
      setEmail('');
      setExpiryDate('');
      setFoundUser(null);
      
    } catch (error) {
      console.error('Error assigning license:', error);
      toast({
        title: "Error",
        description: "Failed to assign license",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Card className="glass-panel border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <span>Manual License Assignment</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* User search section */}
          <div className="space-y-3">
            <Label htmlFor="userEmail">User Email</Label>
            <div className="flex gap-2">
              <Input
                id="userEmail"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching || !email.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                {isSearching ? (
                  <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                <span>Search</span>
              </Button>
            </div>
          </div>

          {/* Found user info */}
          {foundUser && (
            <div className="border rounded-md p-4 bg-muted/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{foundUser.username}</h3>
                  <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                </div>
              </div>
              
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium capitalize">{foundUser.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">{foundUser.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Active:</span>
                  <span className="font-medium">{foundUser.licenseActive ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          )}

          {/* License expiry date */}
          {foundUser && (
            <div className="space-y-3">
              <Label htmlFor="expiryDate">License Expiry (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for a license that doesn't expire
              </p>
            </div>
          )}

          {/* Assign license button */}
          {foundUser && (
            <Button 
              onClick={handleAssignLicense}
              disabled={isAssigning}
              className="w-full bg-primary hover:bg-primary/90 mt-4"
            >
              {isAssigning ? (
                <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
              ) : (
                <UserCheck className="h-4 w-4 mr-2" />
              )}
              <span>Assign License</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
