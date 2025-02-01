import { toast } from "sonner";

export interface ChromeUser {
  id: string;
  uid: string; // Added for compatibility
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface ChromeStorageData {
  currentUser: ChromeUser | null;
  preferences: Record<string, any>;
  subscriptions: Record<string, any>;
  bookmarks: Record<string, any>;
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
        photoURL: data.picture
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
        uid: data.sub, // Set uid same as id for compatibility
        email: data.email,
        displayName: data.name,
        photoURL: data.picture
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

// Chrome storage wrapper for subscription data
export const chromeStorage = {
  async getSubscriptionData(userId: string) {
    try {
      const { subscriptions } = await chrome.storage.sync.get('subscriptions');
      return subscriptions?.[userId] || null;
    } catch (error) {
      console.error('Error getting subscription data:', error);
      return null;
    }
  },

  async setSubscriptionData(userId: string, data: any) {
    try {
      const { subscriptions = {} } = await chrome.storage.sync.get('subscriptions');
      subscriptions[userId] = data;
      await chrome.storage.sync.set({ subscriptions });
    } catch (error) {
      console.error('Error setting subscription data:', error);
      throw error;
    }
  }
};
