
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

  const getUserInfo = async (token: string): Promise<ChromeUser> => {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    const data = await response.json();
    return {
      id: data.sub,
      email: data.email,
      displayName: data.name,
      photoURL: data.picture
    };
  };

  const signIn = async () => {
    try {
      console.log('Starting Google sign-in...');
      
      if (!chrome.identity) {
        throw new Error('Chrome identity API not available');
      }

      // Request token with interactive prompt
      const auth = await chrome.identity.getAuthToken({ 
        interactive: true,
        scopes: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ]
      });

      console.log('Auth token received:', auth ? 'Yes' : 'No');
      
      if (!auth?.token) {
        throw new Error('Failed to get auth token');
      }

      // Get user info with token
      const userData = await getUserInfo(auth.token);
      console.log('User info retrieved:', { email: userData.email });

      // Update state
      setUser(userData);
      setIsAdmin(userData.email?.endsWith('@chromarx.com') || false);
      toast.success('Successfully signed in!');
    } catch (error) {
      console.error('Sign in error:', error);
      // Remove cached token if auth failed
      try {
        const token = await chrome.identity.getAuthToken({ interactive: false });
        if (token) {
          await chrome.identity.removeCachedAuthToken({ token: token.token });
        }
      } catch (e) {
        console.error('Error removing cached token:', e);
      }
      toast.error(error instanceof Error ? error.message : 'Failed to sign in');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign-out...');
      const token = await chrome.identity.getAuthToken({ interactive: false });
      if (token) {
        await chrome.identity.removeCachedAuthToken({ token: token.token });
        // Revoke access
        const response = await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token.token}`);
        if (!response.ok) {
          console.warn('Token revocation failed:', response.status);
        }
      }
      setUser(null);
      setIsAdmin(false);
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
      throw error;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing authentication...');
        const token = await chrome.identity.getAuthToken({ interactive: false });
        if (token?.token) {
          const userData = await getUserInfo(token.token);
          setUser(userData);
          setIsAdmin(userData.email?.endsWith('@chromarx.com') || false);
          console.log('User authenticated:', userData.email);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear any invalid tokens
        try {
          const token = await chrome.identity.getAuthToken({ interactive: false });
          if (token) {
            await chrome.identity.removeCachedAuthToken({ token: token.token });
          }
        } catch (e) {
          console.error('Error removing cached token:', e);
        }
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
