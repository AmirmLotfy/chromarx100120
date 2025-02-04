import { toast } from 'sonner';
import { chromeDb } from '@/lib/chrome-storage';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  summarizationEnabled: boolean;
  language: string;
}

export const signInWithGoogle = async () => {
  try {
    const token = await chrome.identity.getAuthToken({ interactive: true });
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token.token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user info');
    }
    
    const data = await response.json();
    const user = {
      id: data.sub,
      email: data.email,
      displayName: data.name,
      photoURL: data.picture,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    await chromeDb.set('user', user);
    await chromeDb.set('settings', {
      theme: 'system',
      notifications: true,
      summarizationEnabled: true,
      language: 'en',
    });

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
    const token = await chrome.identity.getAuthToken({ interactive: false });
    if (token) {
      await chrome.identity.removeCachedAuthToken({ token: token.token });
    }
    await chromeDb.remove('user');
    toast.success('Successfully signed out');
  } catch (error: any) {
    console.error('Error signing out:', error);
    toast.error(error.message || 'Failed to sign out');
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    return await chromeDb.get('user');
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};