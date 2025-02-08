
import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithGoogle, signOut, getCurrentUser, type ChromeUser } from '@/services/authService';

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
    try {
      const userData = await signInWithGoogle();
      setUser(userData);
      setIsAdmin(userData.email?.endsWith('@chromarx.com') || false);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Initialize auth state from chrome storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing authentication...');
        const userData = await getCurrentUser();
        if (userData) {
          console.log('Found user:', userData);
          setUser(userData);
          setIsAdmin(userData.email?.endsWith('@chromarx.com') || false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
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
