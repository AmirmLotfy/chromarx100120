
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface User {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email
          });
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setLoading(false);
      }
    };

    // Safely check for session, with error handling for remixes
    try {
      checkSession();
    } catch (e) {
      console.error('Failed to check session, possibly a remix issue:', e);
      setLoading(false);
    }

    // Listen for auth changes
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const { data } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      );
      
      subscription = data.subscription;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setLoading(false);
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (e) {
          console.error('Error unsubscribing from auth:', e);
        }
      }
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Get the current URL without any query parameters
      const baseUrl = window.location.origin;
      const redirectUrl = chrome.runtime?.getURL 
        ? chrome.runtime.getURL('index.html') 
        : `${baseUrl}/#/auth`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast.error('Failed to sign in with Google. Please try again.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
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
