
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  isAuthenticated, 
  signIn, 
  signOut, 
  getUserInfo, 
  setupAutoTokenRefresh 
} from '../services/authService';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  userInfo: any;
  login: () => Promise<boolean>;
  logout: () => Promise<boolean>;
  refreshUserInfo: () => Promise<any>;
  // Adding aliases for backward compatibility with existing code
  user: any;
  loading: boolean;
  signInWithGoogle: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: true,
  userInfo: null,
  login: async () => false,
  logout: async () => false,
  refreshUserInfo: async () => null,
  // Adding aliases for backward compatibility
  user: null,
  loading: true,
  signInWithGoogle: async () => false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        setIsLoggedIn(authenticated);
        
        if (authenticated) {
          const info = await getUserInfo();
          setUserInfo(info);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Set up automatic token refresh when logged in
  useEffect(() => {
    let cleanupFn = () => {};
    
    if (isLoggedIn) {
      cleanupFn = setupAutoTokenRefresh();
    }
    
    return () => {
      cleanupFn();
    };
  }, [isLoggedIn]);

  // Login function
  const login = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await signIn();
      
      if (success) {
        setIsLoggedIn(true);
        const info = await getUserInfo(true); // Force refresh
        setUserInfo(info);
      }
      
      return success;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await signOut();
      
      if (success) {
        setIsLoggedIn(false);
        setUserInfo(null);
      }
      
      return success;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user info function
  const refreshUserInfo = async (): Promise<any> => {
    try {
      const info = await getUserInfo(true); // Force refresh
      setUserInfo(info);
      return info;
    } catch (error) {
      console.error('Error refreshing user info:', error);
      return null;
    }
  };

  // Creating alias functions for backward compatibility
  const signInWithGoogle = login;
  
  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        userInfo,
        login,
        logout,
        refreshUserInfo,
        // Aliases for backward compatibility
        user: userInfo,
        loading: isLoading,
        signInWithGoogle
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default useAuth;
