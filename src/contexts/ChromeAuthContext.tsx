import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface ChromeUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

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
        email: data.email,
        displayName: data.name,
        photoURL: data.picture
      };
      
      setUser(userData);
      // Set admin status based on email domain or other criteria
      setIsAdmin(userData.email?.endsWith('@chromarx.com') || false);
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
      setIsAdmin(false);
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
              email: data.email,
              displayName: data.name,
              photoURL: data.picture
            };
            setUser(userData);
            setIsAdmin(userData.email?.endsWith('@chromarx.com') || false);
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
    <ChromeAuthContext.Provider value={{ user, loading, isAdmin, signIn, signOut }}>
      {children}
    </ChromeAuthContext.Provider>
  );
};