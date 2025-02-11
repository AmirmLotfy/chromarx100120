
import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, signOut, type ChromeUser } from '@/services/authService';
import { toast } from 'sonner';

interface ChromeAuthContextType {
  user: ChromeUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const ChromeAuthContext = createContext<ChromeAuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signIn: async () => {},
  signOut: async () => {},
});

export const useChromeAuth = () => useContext(ChromeAuthContext);

export const ChromeAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<ChromeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      console.log('Initiating sign in process...');
      const userData = await getCurrentUser();
      if (!userData) {
        throw new Error('Could not get user data');
      }
      console.log('Sign in successful:', userData);
      setUser(userData);
      setIsAdmin(userData.email?.endsWith('@chromarx.com') || false);
      toast.success('Successfully signed in!');
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      console.log('Initiating sign out process...');
      await signOut();
      setUser(null);
      setIsAdmin(false);
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Initialize auth state from chrome storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing authentication...');
        const userData = await getCurrentUser();
        if (userData) {
          console.log('Found existing user:', userData);
          setUser(userData);
          setIsAdmin(userData.email?.endsWith('@chromarx.com') || false);
        } else {
          console.log('No existing user found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        toast.error('Error initializing authentication');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <ChromeAuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isAdmin, 
        signIn: handleSignIn, 
        signOut: handleSignOut 
      }}
    >
      {children}
    </ChromeAuthContext.Provider>
  );
};

