import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ChromeUser } from '@/lib/chrome-utils';

interface ChromeAuthContextType {
  user: ChromeUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin?: boolean;
}

const ChromeAuthContext = createContext<ChromeAuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  isAdmin: false
});

export const useChromeAuth = () => useContext(ChromeAuthContext);

export const ChromeAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<ChromeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const signIn = async () => {
    try {
      const token = await chrome.identity.getAuthToken({ interactive: true });
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token.token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }
      
      const data = await response.json();
      const userData: ChromeUser = {
        id: data.sub,
        uid: data.sub,
        email: data.email,
        displayName: data.name,
        photoURL: data.picture,
        getIdToken: async () => token.token
      };
      
      setUser(userData);
      toast.success('Successfully signed in!');
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in. Please try again.');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const token = await chrome.identity.getAuthToken({ interactive: false });
      if (token) {
        await chrome.identity.removeCachedAuthToken({ token: token.token });
      }
      setUser(null);
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
      throw error;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await chrome.identity.getAuthToken({ interactive: false });
        if (token) {
          const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token.token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            const userData: ChromeUser = {
              id: data.sub,
              uid: data.sub,
              email: data.email,
              displayName: data.name,
              photoURL: data.picture,
              getIdToken: async () => token.token
            };
            setUser(userData);
          }
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
    <ChromeAuthContext.Provider value={{ user, loading, signIn, signOut, isAdmin }}>
      {children}
    </ChromeAuthContext.Provider>
  );
};