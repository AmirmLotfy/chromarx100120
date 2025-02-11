
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

export const getCurrentUser = async (): Promise<ChromeUser | null> => {
  try {
    console.log('Getting current user identity...');
    
    // Clear any existing cached tokens first
    await chrome.identity.clearAllCachedAuthTokens();
    
    // Get auth token without interactive prompt
    console.log('Requesting auth token...');
    const authResult = await chrome.identity.getAuthToken({ 
      interactive: false,
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    });
    
    if (!authResult?.token) {
      console.log('No token available, user needs to grant permissions');
      return null;
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
      return null;
    }
    
    const data = await response.json();
    console.log('User info received:', data);

    if (!data.sub || !data.email) {
      console.error('Invalid user data received:', data);
      return null;
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
    return user;
  } catch (error: any) {
    console.error('Error getting user identity:', error);
    await chrome.identity.clearAllCachedAuthTokens();
    return null;
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
