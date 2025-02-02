import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { chromeDb } from '@/lib/chrome-storage';

export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signIn = async () => {
    try {
      console.log('Initiating Google OAuth sign-in...');
      const token = await chrome.identity.getAuthToken({ interactive: true });
      console.log('OAuth token received');

      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token.token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }
      
      const data = await response.json();
      console.log('User info retrieved:', { email: data.email, name: data.name });

      const userData: User = {
        id: data.sub,
        email: data.email,
        displayName: data.name,
        photoURL: data.picture
      };
      
      await chromeDb.set('user', userData);
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
      console.log('Initiating sign-out process...');
      const token = await chrome.identity.getAuthToken({ interactive: false });
      if (token) {
        await chrome.identity.removeCachedAuthToken({ token: token.token });
        console.log('OAuth token removed');
      }
      await chromeDb.remove('user');
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
        console.log('Initializing authentication...');
        const storedUser = await chromeDb.get<User>('user');
        if (storedUser) {
          console.log('Found stored user:', { email: storedUser.email });
          setUser(storedUser);
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
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};