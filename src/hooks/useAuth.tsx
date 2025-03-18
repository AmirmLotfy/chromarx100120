
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { auth, ChromeUser } from '../lib/chrome-utils';
import { toast } from 'sonner';

interface AuthContextType {
  user: ChromeUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasPremiumAccess: () => Promise<boolean>;
  getAuthToken: () => Promise<string | null>;
}

// Create a context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  hasPremiumAccess: async () => false,
  getAuthToken: async () => null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ChromeUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await auth.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    
    // Set up a listener for authentication state changes if available
    // In Chrome extensions, this could be handled via messages from background script
    const handleAuthChange = (message: any) => {
      if (message.type === 'AUTH_STATE_CHANGED') {
        loadUser();
      }
    };
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleAuthChange);
    }
    
    return () => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.removeListener(handleAuthChange);
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const signedInUser = await auth.signIn();
      setUser(signedInUser);
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in with Google.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const hasPremiumAccess = async (): Promise<boolean> => {
    return await auth.hasPremiumAccess();
  };
  
  const getAuthToken = async (): Promise<string | null> => {
    return await auth.getIdToken();
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user,
        loading,
        signInWithGoogle,
        signOut,
        hasPremiumAccess,
        getAuthToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
