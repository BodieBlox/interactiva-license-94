
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '@/utils/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ShieldCheck } from 'lucide-react';

export const AdminCreator = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if the secret key is correct - this is a simple way to restrict access
    if (secretKey !== 'create_admin_secret') {
      toast({
        title: "Error",
        description: "Invalid secret key",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create a user document in Realtime Database
      await set(ref(database, `users/${user.uid}`), {
        id: user.uid,
        username: email.split('@')[0],
        email: email,
        role: 'admin',
        status: 'active',
        licenseActive: true,
        createdAt: new Date().toISOString()
      });
      
      toast({
        title: "Success",
        description: "Admin user created successfully",
      });
      
      // Clear the form
      setEmail('');
      setPassword('');
      setSecretKey('');
    } catch (error) {
      console.error('Error creating admin user:', error);
      setError((error as Error).message);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Special case to handle the hardcoded user
  const createHardcodedAdmin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Attempt to create the user (will fail if exists)
      try {
        await createUserWithEmailAndPassword(auth, 'dbrenner512@gmail.com', '123456');
      } catch (error) {
        console.log('User might already exist, continuing to create document');
      }
      
      // Get user ID (either from new or existing user)
      const userRecord = await auth.currentUser;
      const uid = userRecord?.uid || 'U3HZYimHJAMqmzHBh9nb5DvsRJz2'; // Fallback ID from your console logs
      
      // Create a user document in Realtime Database
      await set(ref(database, `users/${uid}`), {
        id: uid,
        username: 'dbrenner512',
        email: 'dbrenner512@gmail.com',
        role: 'admin',
        status: 'active',
        licenseActive: true,
        createdAt: new Date().toISOString()
      });
      
      toast({
        title: "Success",
        description: "Admin user created successfully",
      });
    } catch (error) {
      console.error('Error creating hardcoded admin:', error);
      setError((error as Error).message);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-10">
      <Card className="glass-panel shadow-xl border-0">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-medium">Admin Creator</CardTitle>
          <CardDescription>Create a new admin user</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                placeholder="Enter the secret key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mx-auto"></div>
              ) : (
                'Create Admin'
              )}
            </Button>
          </form>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <CardDescription className="mb-2">Or create the hardcoded admin</CardDescription>
            <Button 
              type="button" 
              className="w-full bg-secondary hover:bg-secondary/90"
              onClick={createHardcodedAdmin}
              disabled={isLoading}
            >
              Create dbrenner512@gmail.com
            </Button>
          </div>
        </CardContent>
        {error && (
          <CardFooter>
            <p className="text-sm text-red-500 animate-fade-in">{error}</p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
