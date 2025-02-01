import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChromeUser, auth, storage } from '@/lib/chrome-utils';

interface FirebaseContextType {
  user: ChromeUser | null;
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
  const [user, setUser] = useState<ChromeUser | null>(null);
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
      const user = await auth.signIn();
      const adminStatus = await checkAdminStatus(user.id);
      setIsAdmin(adminStatus);
      setUser(user);
      toast.success('Successfully signed in!');
      navigate('/bookmarks');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast.error('Failed to sign in with Google');
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setIsAdmin(false);
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
        const currentUser = await auth.getCurrentUser();
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