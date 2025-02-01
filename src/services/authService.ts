import { toast } from 'sonner';
import { chromeDb } from '@/lib/chrome-storage';
import { auth } from '@/lib/chrome-utils';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  summarizationEnabled: boolean;
  language: string;
}

export const signInWithGoogle = async () => {
  try {
    const user = await auth.signIn();
    
    if (user) {
      // Create or update user data in chrome storage
      const userData = await chromeDb.get('user');
      if (!userData) {
        await chromeDb.set('user', {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        });

        // Set default preferences
        await chromeDb.set('settings', {
          theme: 'system',
          notifications: true,
          summarizationEnabled: true,
          language: 'en',
        });
      } else {
        await chromeDb.update('user', {
          lastLogin: new Date().toISOString()
        });
      }
    }

    toast.success('Successfully signed in!');
    return user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    toast.error(error.message || 'Failed to sign in');
    throw error;
  }
};

export const signOut = async () => {
  try {
    await auth.signOut();
    await chromeDb.remove('user');
    toast.success('Successfully signed out');
  } catch (error: any) {
    console.error('Error signing out:', error);
    toast.error(error.message || 'Failed to sign out');
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.getCurrentUser();
};

export const onAuthStateChange = (callback: (user: any) => void) => {
  // Chrome doesn't have a direct auth state listener, so we'll check on storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.user) {
      callback(changes.user.newValue);
    }
  });
};