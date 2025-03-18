
import { toast } from "sonner";

export interface ChromeUser {
  id: string;
  uid: string; // Added for compatibility
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  getIdToken: () => Promise<string>;
  createdAt?: string;
  lastLogin?: string;
}

export interface ChromeStorageData {
  currentUser: ChromeUser | null;
  preferences: Record<string, any>;
  subscriptions: Record<string, any>;
  bookmarks: Record<string, any>;
  installDate: number;
  hasRated: boolean;
  lastRatingPrompt: number;
}

export const getSecret = async (key: string): Promise<string | null> => {
  try {
    const result = await chrome.storage.sync.get(key);
    return result[key] || null;
  } catch (error) {
    console.error(`Error getting secret ${key}:`, error);
    return null;
  }
};

export const storage = {
  async get<T>(key: keyof ChromeStorageData): Promise<T | null> {
    try {
      const result = await chrome.storage.sync.get(key);
      return result[key] || null;
    } catch (error) {
      console.error('Error reading from chrome storage:', error);
      return null;
    }
  },

  async set(key: keyof ChromeStorageData, value: any): Promise<void> {
    try {
      await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
      console.error('Error writing to chrome storage:', error);
      throw error;
    }
  },

  async remove(key: keyof ChromeStorageData): Promise<void> {
    try {
      await chrome.storage.sync.remove(key);
    } catch (error) {
      console.error('Error removing from chrome storage:', error);
      throw error;
    }
  }
};

const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export const auth = {
  async getCurrentUser(): Promise<ChromeUser | null> {
    try {
      console.log('Getting current user from chrome.identity...');
      
      // Check if chrome.identity is available
      if (typeof chrome === 'undefined' || !chrome.identity) {
        console.log('chrome.identity not available, returning null');
        return null;
      }
      
      // Get auth token with proper scopes
      const token = await chrome.identity.getAuthToken({ 
        interactive: false,
        scopes: REQUIRED_SCOPES
      });
      
      if (!token || !token.token) {
        console.log('No auth token available');
        return null;
      }

      // Validate token before using it
      try {
        const tokenInfo = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token.token}`);
        if (!tokenInfo.ok) {
          console.error('Invalid token, removing from cache');
          await chrome.identity.removeCachedAuthToken({ token: token.token });
          return null;
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        return null;
      }
      
      // Get user info with validated token
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token.token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      const user: ChromeUser = {
        id: data.sub,
        uid: data.sub, // Set uid same as id for compatibility
        email: data.email,
        displayName: data.name,
        photoURL: data.picture,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        getIdToken: async () => token.token
      };
      
      // Cache the user in storage for faster access
      await storage.set('currentUser', user);
      
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async signIn(): Promise<ChromeUser> {
    try {
      console.log('Starting Google sign-in process...');
      
      // Clear any existing cached tokens to ensure a fresh login
      if (chrome.identity && chrome.identity.clearAllCachedAuthTokens) {
        await chrome.identity.clearAllCachedAuthTokens();
      }
      
      // Get token in interactive mode to prompt user login
      const token = await chrome.identity.getAuthToken({ 
        interactive: true,
        scopes: REQUIRED_SCOPES
      });
      
      if (!token || !token.token) {
        throw new Error('Failed to get authentication token');
      }

      // Get user info with the new token
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token.token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      const user: ChromeUser = {
        id: data.sub,
        uid: data.sub,
        email: data.email,
        displayName: data.name,
        photoURL: data.picture,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        getIdToken: async () => token.token
      };

      // Store the user in sync storage
      await storage.set('currentUser', user);
      
      // Notify success
      toast.success(`Welcome ${user.displayName || user.email}`);
      
      return user;
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Sign in failed. Please try again.');
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      console.log('Starting sign-out process...');
      
      // Get current token
      const token = await chrome.identity.getAuthToken({ interactive: false });
      
      if (token && token.token) {
        console.log('Removing cached auth token...');
        // Remove token from chrome's cache
        await chrome.identity.removeCachedAuthToken({ token: token.token });
        
        // Revoke token access
        try {
          const response = await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token.token}`);
          if (!response.ok) {
            console.warn('Token revocation failed:', response.status);
          } else {
            console.log('Token successfully revoked');
          }
        } catch (e) {
          console.error('Error revoking token:', e);
        }
      }
      
      // Clear all cached tokens
      if (chrome.identity && chrome.identity.clearAllCachedAuthTokens) {
        await chrome.identity.clearAllCachedAuthTokens();
      }
      
      // Clear stored user data
      await storage.remove('currentUser');
      
      toast.success('Successfully signed out');
      console.log('Sign-out completed successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out. Please try again.');
      throw error;
    }
  },
  
  // Helper method to check if a user has premium features
  async hasPremiumAccess(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;
      
      // This could be expanded to check a subscription database or other premium verification
      // For now, we're just checking if the user is authenticated
      return true;
    } catch (error) {
      console.error('Error checking premium access:', error);
      return false;
    }
  },
  
  // Get fresh ID token for API authentication
  async getIdToken(): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;
      
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }
};
