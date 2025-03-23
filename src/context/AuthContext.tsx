import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, get, set, update, onValue } from 'firebase/database';
import { User, License } from '../utils/types';
import { auth, database } from '../utils/firebase';
import { toast } from '@/components/ui/use-toast';
import { 
  getUserByEmail, 
  logUserLogin, 
  createLicenseRequest, 
  getLicenseByKey, 
  getLicense, 
  updateLicense, 
  updateUser 
} from '@/utils/api';

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
  checkLicenseValidity: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log("Firebase auth state changed:", firebaseUser?.email);
      setIsLoading(true);
      if (firebaseUser) {
        try {
          console.log("Fetching user from database:", firebaseUser.email);
          const userFromDB = await getUserByEmail(firebaseUser.email || '').catch((err) => {
            console.log("Error fetching user, will check Firebase DB:", err);
            return null;
          });
          
          if (userFromDB) {
            console.log("User found in API database:", userFromDB.email);
            
            if (userFromDB.licenseActive && userFromDB.licenseKey) {
              const needsLicenseUpdate = await checkLicenseExpiry(userFromDB.licenseKey);
              if (needsLicenseUpdate) {
                await updateUser(userFromDB.id, {
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
            
            if (userFromDB.forcedLogout) {
              await updateUser(userFromDB.id, {
                forcedLogout: null
              });
              
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
            
            setUser(userFromDB);
            
            try {
              const ip = await fetchIP();
              await logUserLogin(
                userFromDB.id, 
                { ip, userAgent: navigator.userAgent }
              );
            } catch (e) {
              console.error("Error logging login:", e);
            }
          } else {
            console.log("Checking Firebase DB for user:", firebaseUser.uid);
            const userRef = ref(database, `users/${firebaseUser.uid}`);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
              console.log("User found in Firebase DB:", snapshot.val());
              const userData = snapshot.val();
              setUser(userData);
              
              try {
                const ip = await fetchIP();
                await logUserLogin(
                  userData.id, 
                  { ip, userAgent: navigator.userAgent }
                );
              } catch (e) {
                console.error("Error logging login:", e);
              }
            } else {
              console.log("Creating new user in Firebase DB");
              const newUser: User = {
                id: firebaseUser.uid,
                username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email || '',
                role: 'user',
                status: 'active',
                licenseActive: false
              };
              
              await set(userRef, newUser);
              setUser(newUser);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError(`Error fetching user data: ${(error as Error).message}`);
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
      const license = await getLicenseByKey(licenseKey);
      
      if (!license) {
        const licenseRef = ref(database, `licenses/${licenseKey}`);
        const licenseSnapshot = await get(licenseRef);
        
        if (!licenseSnapshot.exists()) {
          console.log("License not found:", licenseKey);
          return true;
        }
        
        const licenseData = licenseSnapshot.val();
        
        if (licenseData.status !== 'active' || !licenseData.isActive) {
          console.log("License is not active:", licenseKey);
          return true;
        }
        
        if (licenseData.expiresAt) {
          const expiryDate = new Date(licenseData.expiresAt);
          const now = new Date();
          
          if (expiryDate < now) {
            console.log("License has expired:", licenseKey, expiryDate);
            return true;
          }
        }
        
        return false;
      }
      
      if (license.status !== 'active' || !license.isActive) {
        console.log("License is not active:", license.key);
        return true;
      }
      
      if (license.expiresAt) {
        const expiryDate = new Date(license.expiresAt);
        const now = new Date();
        
        if (expiryDate < now) {
          console.log("License has expired:", license.key, expiryDate);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking license expiry:', error);
      return false;
    }
  };

  const checkLicenseValidity = async (): Promise<boolean> => {
    if (!user || !user.licenseKey) return true;
    
    try {
      const license = await getLicenseByKey(user.licenseKey);
      
      if (!license) {
        const licenseRef = ref(database, `licenses/${user.licenseKey}`);
        const licenseSnapshot = await get(licenseRef);
        
        if (!licenseSnapshot.exists()) {
          await updateUser(user.id, {
            licenseActive: false,
            licenseKey: null,
            licenseType: null,
            licenseExpiryDate: null
          });
          
          setUser({
            ...user,
            licenseActive: false,
            licenseKey: undefined,
            licenseType: undefined,
            licenseExpiryDate: undefined
          });
          
          toast({
            title: "License Invalid",
            description: "Your license key is not valid. Please activate a new license.",
            variant: "destructive"
          });
          
          return true;
        }
        
        const licenseData = licenseSnapshot.val();
        
        if (licenseData.status !== 'active' || !licenseData.isActive) {
          await updateUser(user.id, {
            licenseActive: false
          });
          
          setUser({
            ...user,
            licenseActive: false
          });
          
          toast({
            title: "License Inactive",
            description: "Your license is not active. Please contact support.",
            variant: "destructive"
          });
          
          return true;
        }
        
        if (licenseData.expiresAt) {
          const expiryDate = new Date(licenseData.expiresAt);
          const now = new Date();
          
          if (expiryDate < now) {
            await updateUser(user.id, {
              licenseActive: false
            });
            
            setUser({
              ...user,
              licenseActive: false
            });
            
            toast({
              title: "License Expired",
              description: "Your license has expired. Please activate a new license.",
              variant: "destructive"
            });
            
            return true;
          }
        }
        
        return false;
      }
      
      if (license.status !== 'active' || !license.isActive) {
        await updateUser(user.id, {
          licenseActive: false
        });
        
        setUser({
          ...user,
          licenseActive: false
        });
        
        toast({
          title: "License Inactive",
          description: "Your license is not active. Please contact support.",
          variant: "destructive"
        });
        
        return true;
      }
      
      if (license.expiresAt) {
        const expiryDate = new Date(license.expiresAt);
        const now = new Date();
        
        if (expiryDate < now) {
          await updateUser(user.id, {
            licenseActive: false
          });
          
          setUser({
            ...user,
            licenseActive: false
          });
          
          toast({
            title: "License Expired",
            description: "Your license has expired. Please activate a new license.",
            variant: "destructive"
          });
          
          return true;
        }
      }
      
      if (license.suspendedAt) {
        await updateUser(user.id, {
          licenseActive: false
        });
        
        setUser({
          ...user,
          licenseActive: false
        });
        
        toast({
          title: "License Suspended",
          description: "Your license has been suspended. Please contact support.",
          variant: "destructive"
        });
        
        return true;
      }
      
      if (!user.licenseActive) {
        await updateUser(user.id, {
          licenseActive: true,
          licenseType: license.type,
          licenseExpiryDate: license.expiresAt
        });
        
        setUser({
          ...user,
          licenseActive: true,
          licenseType: license.type,
          licenseExpiryDate: license.expiresAt
        });
      }
      
      return false;
    } catch (error) {
      console.error('Error checking license validity:', error);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Login attempt with:", email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase login success:", result.user?.email);
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
      window.location.href = '/login';
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
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
    if (!user) {
      setError("You must be logged in to activate a license");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const normalizedKey = licenseKey.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const formattedKey = normalizedKey.match(/.{1,4}/g)?.join('-') || normalizedKey;
      
      if (formattedKey === 'FREE-1234-5678-9ABC' || normalizedKey === 'FREE12345678-9ABC' || normalizedKey === 'FREE123456789ABC') {
        console.log("Activating demo license key");
        
        const existingLicense = await getLicenseByKey(formattedKey);
        
        if (!existingLicense) {
          const demoLicense: Partial<License> = {
            key: formattedKey,
            isActive: true,
            status: 'active',
            type: 'basic',
            createdAt: new Date().toISOString(),
            activatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          };
          
          const licenseRef = ref(database, `licenses/demo_license`);
          await set(licenseRef, demoLicense);
        }
        
        const updatedUser: User = {
          ...user,
          licenseActive: true,
          licenseKey: formattedKey,
          licenseType: 'basic',
          licenseExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        await updateUser(user.id, {
          licenseActive: true,
          licenseKey: formattedKey,
          licenseType: 'basic',
          licenseExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        
        setUser(updatedUser);
        setIsLoading(false);
        return;
      }
      
      const license = await getLicenseByKey(formattedKey);
      
      if (!license) {
        setError('Invalid license key');
        setIsLoading(false);
        return;
      }
      
      if (license.status !== 'active' || !license.isActive) {
        setError('This license is not active');
        setIsLoading(false);
        return;
      }
      
      if (license.userId && license.userId !== user.id) {
        setError('This license key is already activated by another user');
        setIsLoading(false);
        return;
      }
      
      if (license.expiresAt) {
        const expiryDate = new Date(license.expiresAt);
        const now = new Date();
        
        if (expiryDate < now) {
          setError('This license has expired');
          setIsLoading(false);
          return;
        }
      }
      
      const licenseType = (license.type === 'basic' || license.type === 'premium' || license.type === 'enterprise') 
        ? license.type 
        : 'basic';
        
      await updateLicense(license.id, {
        isActive: true,
        userId: user.id,
        activatedAt: new Date().toISOString()
      });
      
      const updatedUser: User = {
        ...user,
        licenseActive: true,
        licenseKey: formattedKey,
        licenseType: licenseType,
        licenseExpiryDate: license.expiresAt
      };
      
      await updateUser(user.id, {
        licenseActive: true,
        licenseKey: formattedKey,
        licenseType: licenseType,
        licenseExpiryDate: license.expiresAt
      });
      
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
    if (!user) {
      setError("You must be logged in to request a license");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await createLicenseRequest(user.id, user.username, user.email, message);
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
  
  const checkForcedLogout = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      console.log(`Checking forced logout status for user ${user.id}`);
      const userRef = ref(database, `users/${user.id}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val() as User;
        
        if (userData.forcedLogout) {
          await update(userRef, {
            forcedLogout: null
          });
          
          await signOut(auth);
          toast({
            title: "Session Terminated",
            description: "Your session was terminated by an administrator",
            variant: "destructive"
          });
          setUser(null);
          return true;
        }
        
        if (userData.status === 'suspended') {
          toast({
            title: "Account Suspended",
            description: userData.warningMessage || "Your account has been suspended by an administrator",
            variant: "destructive"
          });
          
          await signOut(auth);
          setUser(null);
          return true;
        }
        
        if (userData.status === 'warned' && user.status !== 'warned') {
          toast({
            title: "Account Warning",
            description: userData.warningMessage || "Your account has received a warning from an administrator",
            variant: "warning"
          });
          
          setUser(userData);
        }
        
        if (JSON.stringify(userData) !== JSON.stringify(user)) {
          setUser(userData);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Check forced logout error:', error);
      return false;
    }
  }, [user]);
  
  useEffect(() => {
    if (!user?.id) return;
    
    console.log(`Setting up real-time status listener for user ${user.id}`);
    const userRef = ref(database, `users/${user.id}`);
    
    const unsubscribe = onValue(userRef, async (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val() as User;
        
        if (userData.status === 'suspended' && user.status !== 'suspended') {
          console.log(`User ${user.id} status changed to suspended, forcing logout`);
          
          toast({
            title: "Account Suspended",
            description: userData.warningMessage || "Your account has been suspended by an administrator",
            variant: "destructive"
          });
          
          await signOut(auth);
          setUser(null);
          return;
        }
        
        if (userData.status === 'warned' && user.status !== 'warned') {
          console.log(`User ${user.id} status changed to warned, showing warning`);
          
          toast({
            title: "Account Warning",
            description: userData.warningMessage || "Your account has received a warning from an administrator",
            variant: "warning"
          });
          
          setUser(userData);
        }
        
        if (userData.forcedLogout) {
          console.log(`User ${user.id} has been force logged out`);
          
          await update(userRef, {
            forcedLogout: null
          });
          
          toast({
            title: "Session Terminated",
            description: "Your session was terminated by an administrator",
            variant: "destructive"
          });
          
          await signOut(auth);
          setUser(null);
        }
      }
    });
    
    return () => unsubscribe();
  }, [user]);
  
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
        setUser,
        checkLicenseValidity
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
