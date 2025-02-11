
import { toast } from 'sonner';
import { chromeDb } from '@/lib/chrome-storage';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  summarizationEnabled: boolean;
  language: string;
}

export interface ChromeUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLogin: string;
}

export const signInWithGoogle = async (): Promise<ChromeUser> => {
  try {
    console.log('Starting Google sign-in process...');
    
    // Get auth token with interactive prompt
    console.log('Requesting auth token...');
    const authResult = await chrome.identity.getAuthToken({ 
      interactive: true 
    });
    
    if (!authResult?.token) {
      console.error('No token received');
      throw new Error('Failed to get authentication token');
    }

    console.log('Token received, fetching user info...');
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 
        Authorization: `Bearer ${authResult.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('User info fetch failed:', response.status);
      await chrome.identity.removeCachedAuthToken({ token: authResult.token });
      throw new Error('Failed to get user information');
    }
    
    const data = await response.json();
    console.log('User info received:', data);

    if (!data.sub || !data.email) {
      console.error('Invalid user data received:', data);
      throw new Error('Invalid user data received from Google');
    }

    const user: ChromeUser = {
      id: data.sub,
      email: data.email,
      displayName: data.name || null,
      photoURL: data.picture || null,
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

    console.log('User data stored successfully:', user);
    toast.success('Successfully signed in!');
    return user;
  } catch (error: any) {
    console.error('Error in signInWithGoogle:', error);
    toast.error(error.message || 'Failed to sign in with Google');
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    console.log('Starting sign-out process...');
    
    const authResult = await chrome.identity.getAuthToken({ interactive: false });
    
    if (authResult?.token) {
      // Remove token from chrome's cache
      await chrome.identity.removeCachedAuthToken({ token: authResult.token });
      
      // Revoke access
      const response = await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${authResult.token}`);
      if (!response.ok) {
        console.warn('Token revocation failed:', response.status);
      }
    }
    
    // Clear all cached tokens
    await chrome.identity.clearAllCachedAuthTokens();
    
    // Clear stored data
    await chromeDb.remove('user');
    await chromeDb.remove('settings');
    
    console.log('Sign-out completed successfully');
    toast.success('Successfully signed out');
  } catch (error: any) {
    console.error('Error in signOut:', error);
    toast.error(error.message || 'Failed to sign out');
    throw error;
  }
};

export const getCurrentUser = async (): Promise<ChromeUser | null> => {
  try {
    console.log('Getting current user...');
    const user = await chromeDb.get<ChromeUser>('user');
    
    if (!user) {
      console.log('No user found in storage');
      return null;
    }

    // Verify token is still valid
    try {
      const authResult = await chrome.identity.getAuthToken({ interactive: false });
      if (!authResult?.token) {
        console.log('No valid token found, clearing user data');
        await chromeDb.remove('user');
        return null;
      }
      console.log('Valid token found for current user');
    } catch (error) {
      console.error('Error verifying token:', error);
      await chromeDb.remove('user');
      return null;
    }

    console.log('Returning current user:', user);
    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};
