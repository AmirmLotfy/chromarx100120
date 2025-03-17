
import { createContext, useContext, ReactNode } from 'react';

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

// Create a context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Provide a dummy user for development
  const dummyUser = {
    id: 'demo-user-id',
    email: 'demo@example.com'
  };

  const signInWithGoogle = async () => {
    console.log('Sign in with Google called (dummy implementation)');
    // No actual implementation needed
  };

  const signOut = async () => {
    console.log('Sign out called (dummy implementation)');
    // No actual implementation needed
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user: dummyUser, // Always provide the dummy user
        loading: false,
        signInWithGoogle,
        signOut
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
