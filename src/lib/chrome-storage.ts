export interface ChromeUser {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface FeedbackItem {
  type: string;
  message: string;
  userId: string;
  userEmail: string | null;
  createdAt: string;
  status: string;
}

export interface StorageData {
  user: ChromeUser | null;
  settings: {
    geminiApiKey?: string;
    paypal?: {
      clientId: string;
      secretKey: string;
    };
    dataCollection: boolean;
    experimentalFeatures: boolean;
  };
  usage: {
    bookmarks: number;
    notes: number;
    aiRequests: number;
  };
  subscriptions: Record<string, any>;
  history: any[];
  feedback: FeedbackItem[];
  privacySettings: {
    userId: string;
    dataCollection: boolean;
    notifications: {
      bookmarks: boolean;
      updates: boolean;
      reminders: boolean;
    };
  };
  config: {
    affiliateContent?: {
      products: any[];
    };
  };
}

export const chromeDb = {
  async get<T>(key: keyof StorageData): Promise<T | null> {
    try {
      const result = await chrome.storage.sync.get(key);
      return result[key] || null;
    } catch (error) {
      console.error(`Error reading ${key} from chrome storage:`, error);
      return null;
    }
  },

  async set(key: keyof StorageData, value: any): Promise<void> {
    try {
      await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
      console.error(`Error writing ${key} to chrome storage:`, error);
      throw error;
    }
  },

  async update(key: keyof StorageData, value: Partial<any>): Promise<void> {
    try {
      const current = await this.get(key);
      await this.set(key, { ...current, ...value });
    } catch (error) {
      console.error(`Error updating ${key} in chrome storage:`, error);
      throw error;
    }
  },

  async remove(key: keyof StorageData): Promise<void> {
    try {
      await chrome.storage.sync.remove(key);
    } catch (error) {
      console.error(`Error removing ${key} from chrome storage:`, error);
      throw error;
    }
  }
};