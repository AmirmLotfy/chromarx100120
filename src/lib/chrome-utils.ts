
import { toast } from "sonner";

export interface ChromeUser {
  id: string;
  uid: string; // Added for compatibility
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  getIdToken: () => Promise<string>;
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

export const auth = {
  async getCurrentUser(): Promise<ChromeUser | null> {
    try {
      const token = await chrome.identity.getAuthToken({ interactive: false });
      if (!token) return null;

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
        getIdToken: async () => token.token // Added getIdToken method
      };
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async signIn(): Promise<ChromeUser> {
    try {
      const token = await chrome.identity.getAuthToken({ interactive: true });
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
        getIdToken: async () => token.token
      };

      await storage.set('currentUser', user);
      return user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      const token = await chrome.identity.getAuthToken({ interactive: false });
      if (token) {
        await chrome.identity.removeCachedAuthToken({ token: token.token });
      }
      await storage.remove('currentUser');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
};
