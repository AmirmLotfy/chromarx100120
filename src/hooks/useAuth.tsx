import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [user, setUser] = useState<User | null>({ id: 'test-user-id', email: 'test@example.com' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Comment: Auth effect temporarily disabled for testing
    // This preserves the original authentication code for reference
  }, []);

  const signOut = async () => {
    console.log('Sign out clicked (disabled in test mode)');
    // Uncomment to restore real functionality
    // const { error } = await supabase.auth.signOut();
    // if (error) throw error;
  };

  const signInWithGoogle = async () => {
    console.log('Sign in with Google clicked (disabled in test mode)');
    // Uncomment to restore real functionality
    /*
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: chrome.runtime.getURL('index.html')
      }
    });
    
    if (error) throw error;
    */
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
