
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { User } from '../utils/types';
import { auth, database } from '../utils/firebase';
import { toast } from '@/components/ui/use-toast';
import { getUserByEmail, logUserLogin, createLicenseRequest } from '@/utils/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  activateUserLicense: (licenseKey: string) => Promise<void>;
  requestLicense: (message?: string) => Promise<void>;
  checkForcedLogout: () => Promise<boolean>;
  setUser: (user: User) => void;
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
          // Get the user data from Realtime Database by email
          const userFromDB = await getUserByEmail(firebaseUser.email || '');
          
          if (userFromDB) {
            // Check if the user has an expired license
            if (userFromDB.licenseActive && userFromDB.licenseKey) {
              const isExpired = await checkLicenseExpiry(userFromDB.licenseKey);
              if (isExpired) {
                // Update user to reflect expired license
                await update(ref(database, `users/${userFromDB.id}`), {
                  licenseActive: false
                });
                userFromDB.licenseActive = false;
                
                toast({
                  title: "License Expired",
                  description: "Your license has expired. Please activate a new license.",
                  variant: "destructive"
                });
              }
            }
            
            // Check if there's a forcedLogout flag before setting the user
            if (userFromDB.forcedLogout) {
              // Clear the flag
              await update(ref(database, `users/${userFromDB.id}`), {
                forcedLogout: null
              });
              
              // Force logout
              await signOut(auth);
              toast({
                title: "Session Terminated",
                description: "Your session was terminated by an administrator",
                variant: "destructive"
              });
              setUser(null);
              setIsLoading(false);
              return;
            }
            
            // User exists in Database, use that data
            setUser(userFromDB);
            
            // Log this login
            try {
              const ip = await fetchIP();
              await logUserLogin(
                userFromDB.id, 
                ip, 
                navigator.userAgent
              );
            } catch (e) {
              console.error("Error logging login:", e);
            }
          } else {
            // User exists in Auth but not in Database, create a new user document
            const newUser: User = {
              id: firebaseUser.uid,
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: 'user',
              status: 'active',
              licenseActive: false
            };
            
            // Save user in the database with their uid as the key
            await set(ref(database, `users/${firebaseUser.uid}`), newUser);
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
        } finally {
          setIsLoading(false);
        }
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);
  
  const checkLicenseExpiry = async (licenseKey: string): Promise<boolean> => {
    try {
      const licenseRef = ref(database, `licenses/${licenseKey}`);
      const licenseSnapshot = await get(licenseRef);
      
      if (!licenseSnapshot.exists()) {
        return true; // License doesn't exist, consider it expired
      }
      
      const license = licenseSnapshot.val();
      
      if (license.expiresAt) {
        const expiryDate = new Date(license.expiresAt);
        const now = new Date();
        
        if (expiryDate < now) {
          return true; // License has expired
        }
      }
      
      return false; // License is valid
    } catch (error) {
      console.error('Error checking license expiry:', error);
      return false; // On error, don't expire the license
    }
  };

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
      // Look up the license directly by key
      const licenseRef = ref(database, `licenses/${licenseKey}`);
      const licenseSnapshot = await get(licenseRef);
      
      if (!licenseSnapshot.exists()) {
        // For the demo, allow a special key to always work
        if (licenseKey === 'FREE-1234-5678-9ABC') {
          // Create the license with key as ID if it doesn't exist
          await set(licenseRef, {
            id: licenseKey,
            key: licenseKey,
            isActive: true,
            userId: user.id,
            createdAt: new Date().toISOString(),
            activatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
          
          // Update the user
          const updatedUser = {
            ...user,
            licenseActive: true,
            licenseKey: licenseKey
          };
          
          await update(ref(database, `users/${user.id}`), updatedUser);
          
          setUser(updatedUser);
          return;
        }
        
        throw new Error('Invalid license key');
      }
      
      const license = licenseSnapshot.val();
      
      if (license.expiresAt) {
        const expiryDate = new Date(license.expiresAt);
        const now = new Date();
        
        if (expiryDate < now) {
          throw new Error('This license has expired');
        }
      }
      
      if (license.isActive && license.userId !== user.id) {
        throw new Error('License key is already activated by another user');
      }
      
      // Update the license
      await update(licenseRef, {
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
      
      await update(ref(database, `users/${user.id}`), updatedUser);
      
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
  
  const requestLicense = async (message?: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await createLicenseRequest(user.id, message);
      toast({
        title: "License Requested",
        description: "Your license request has been submitted successfully",
        variant: "success"
      });
    } catch (error) {
      console.error('License request error:', error);
      setError((error as Error).message);
      toast({
        title: "License Request Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkForcedLogout = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const userRef = ref(database, `users/${user.id}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.forcedLogout) {
          // Clear the flag
          await update(userRef, {
            forcedLogout: null
          });
          
          // Force logout
          await signOut(auth);
          toast({
            title: "Session Terminated",
            description: "Your session was terminated by an administrator",
            variant: "destructive"
          });
          setUser(null);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Check forced logout error:', error);
      return false;
    }
  };
  
  const fetchIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error fetching IP:', error);
      return 'Unknown';
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
        activateUserLicense,
        requestLicense,
        checkForcedLogout,
        setUser
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
