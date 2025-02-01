import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const checkAdminStatus = async (userId: string) => {
    try {
      const { adminUsers } = await chrome.storage.sync.get('adminUsers');
      return adminUsers?.includes(userId) || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign in process...');
      const token = await chrome.identity.getAuthToken({ interactive: true });
      
      // Fetch user info from Google
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token.token}` }
      });
      
      const userData = await response.json();
      console.log('Sign in successful:', userData.email);
      
      const user = {
        id: userData.sub,
        email: userData.email,
        displayName: userData.name,
        photoURL: userData.picture
      };

      // Store user data
      await chrome.storage.sync.set({
        currentUser: user,
        [`user_${user.id}`]: {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          subscriptionStatus: 'free',
          preferences: {},
          lastSyncedBookmarks: null,
        }
      });
      
      const adminStatus = await checkAdminStatus(user.id);
      setIsAdmin(adminStatus);
      setUser(user);
      
      toast.success('Successfully signed in!');
      navigate('/bookmarks');
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast.error('Failed to sign in with Google');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      await chrome.identity.removeCachedAuthToken({ token: await chrome.identity.getAuthToken({ interactive: false }) });
      setUser(null);
      setIsAdmin(false);
      await chrome.storage.sync.remove('currentUser');
      console.log('Sign out successful');
      toast.success('Successfully signed out');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Checking auth state...');
        const { currentUser } = await chrome.storage.sync.get('currentUser');
        if (currentUser) {
          setUser(currentUser);
          const adminStatus = await checkAdminStatus(currentUser.id);
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, loading, isAdmin, signInWithGoogle, signOut }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);