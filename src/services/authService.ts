
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
    console.log('Starting Google sign-in process...');
    
    // First, clear any existing tokens
    const existingToken = await chrome.identity.getAuthToken({ interactive: false });
    if (existingToken?.token) {
      console.log('Removing existing token...');
      await chrome.identity.removeCachedAuthToken({ token: existingToken.token });
    }

    // Get new token with interactive prompt
    console.log('Requesting new auth token...');
    const token = await chrome.identity.getAuthToken({ 
      interactive: true,
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    });

    if (!token?.token) {
      throw new Error('Failed to get auth token');
    }

    console.log('Token received, fetching user info...');
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token.token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user info');
    }
    
    const data = await response.json();
    console.log('User info received:', data);

    const user = {
      id: data.sub,
      email: data.email,
      displayName: data.name,
      photoURL: data.picture,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    // Store user data
    await chromeDb.set('user', user);
    await chromeDb.set('settings', {
      theme: 'system',
      notifications: true,
      summarizationEnabled: true,
      language: 'en',
    });

    console.log('User data stored successfully');
    toast.success('Successfully signed in!');
    return user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    // Clear cached token if auth failed
    try {
      const token = await chrome.identity.getAuthToken({ interactive: false });
      if (token) {
        await chrome.identity.removeCachedAuthToken({ token: token.token });
      }
    } catch (e) {
      console.error('Error removing cached token:', e);
    }
    toast.error(error.message || 'Failed to sign in');
    throw error;
  }
};

export const signOut = async () => {
  try {
    console.log('Starting sign-out process...');
    const token = await chrome.identity.getAuthToken({ interactive: false });
    if (token) {
      // Remove token from chrome's cache
      await chrome.identity.removeCachedAuthToken({ token: token.token });
      
      // Revoke access
      const response = await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token.token}`);
      if (!response.ok) {
        console.warn('Token revocation failed:', response.status);
      }
    }
    
    // Clear stored data
    await chromeDb.remove('user');
    console.log('Sign-out completed');
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
