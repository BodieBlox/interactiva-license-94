
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User } from '../utils/types';
import { auth, db } from '../utils/firebase';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  activateUserLicense: (licenseKey: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          // Get the user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            // User exists in Firestore, use that data
            setUser(userDoc.data() as User);
          } else {
            // User exists in Auth but not in Firestore, create a new user document
            const newUser: User = {
              id: firebaseUser.uid,
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: 'user',
              status: 'active',
              licenseActive: false
            };
            
            await setDoc(userDocRef, newUser);
            setUser(newUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError(`Error fetching user data: ${(error as Error).message}`);
          // Still set user to null on error to prevent infinite redirect loops
          setUser(null);
          toast({
            title: "Error",
            description: `Failed to load user data: ${(error as Error).message}`,
            variant: "destructive"
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User state will be updated by the onAuthStateChanged listener
    } catch (error) {
      console.error('Login error:', error);
      setError((error as Error).message);
      toast({
        title: "Login Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // User state will be updated by the onAuthStateChanged listener
    } catch (error) {
      console.error('Logout error:', error);
      setError((error as Error).message);
      toast({
        title: "Logout Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const activateUserLicense = async (licenseKey: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Check if the license key exists and is not activated
      const licenseQuery = await getDoc(doc(db, 'licenses', licenseKey));
      
      if (!licenseQuery.exists()) {
        // For the demo, allow a special key to always work
        if (licenseKey === 'FREE-1234-5678-9ABC') {
          // Create the license if it doesn't exist
          await setDoc(doc(db, 'licenses', licenseKey), {
            id: licenseKey,
            key: licenseKey,
            isActive: true,
            userId: user.id,
            createdAt: new Date().toISOString(),
            activatedAt: new Date().toISOString()
          });
          
          // Update the user
          const updatedUser = {
            ...user,
            licenseActive: true,
            licenseKey: licenseKey
          };
          
          await updateDoc(doc(db, 'users', user.id), updatedUser);
          
          setUser(updatedUser);
          return;
        }
        
        throw new Error('Invalid license key');
      }
      
      const license = licenseQuery.data();
      
      if (license.isActive && license.userId !== user.id) {
        throw new Error('License key is already activated by another user');
      }
      
      // Update the license
      await updateDoc(doc(db, 'licenses', licenseKey), {
        isActive: true,
        userId: user.id,
        activatedAt: new Date().toISOString()
      });
      
      // Update the user
      const updatedUser = {
        ...user,
        licenseActive: true,
        licenseKey: licenseKey
      };
      
      await updateDoc(doc(db, 'users', user.id), updatedUser);
      
      setUser(updatedUser);
    } catch (error) {
      console.error('License activation error:', error);
      setError((error as Error).message);
      toast({
        title: "License Activation Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        activateUserLicense
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
