import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  summarizationEnabled: boolean;
  language: string;
}

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Create or update user document
    const userRef = doc(db, 'users', result.user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });

      // Set default preferences
      const prefsRef = doc(db, 'preferences', result.user.uid);
      await setDoc(prefsRef, {
        theme: 'system',
        notifications: true,
        summarizationEnabled: true,
        language: 'en',
      });
    } else {
      // Update last login
      await setDoc(userRef, {
        lastLogin: new Date().toISOString()
      }, { merge: true });
    }

    toast.success('Successfully signed in!');
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    toast.error(error.message || 'Failed to sign in');
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    toast.success('Successfully signed out');
  } catch (error: any) {
    console.error('Error signing out:', error);
    toast.error(error.message || 'Failed to sign out');
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Subscribe to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};