import { createContext, useContext, useEffect, useState } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set persistence when the provider mounts
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Error setting persistence:', error);
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      console.log('Starting Google sign in process...');
      const result = await signInWithPopup(auth, provider);
      console.log('Sign in successful:', result.user.email);
      
      // Create or update user document in Firestore
      const userRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log('Creating new user document...');
        await setDoc(userRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          createdAt: new Date().toISOString(),
          subscriptionStatus: 'free',
          preferences: {},
          lastSyncedBookmarks: null,
        });
        console.log('User document created successfully');
      }
      
      toast.success('Successfully signed in!');
      navigate('/bookmarks');
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      
      // More specific error messages based on error code
      if (error.code === 'auth/popup-blocked') {
        toast.error('Please allow popups for this site to sign in');
      } else if (error.code === 'auth/cancelled-popup-request') {
        toast.error('Sign in was cancelled');
      } else {
        toast.error('Failed to sign in with Google');
      }
      
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      await auth.signOut();
      console.log('Sign out successful');
      toast.success('Successfully signed out');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user?.email || 'No user');
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);