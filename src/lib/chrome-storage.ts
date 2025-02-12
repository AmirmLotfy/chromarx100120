
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

export interface StorageSubscription {
  planId: string;
  status: string;
  createdAt: string;
  endDate: string;
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
    tasks: number;
  };
  user_subscription: StorageSubscription;
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
  [key: `bookmark-category-${string}`]: string;
}

// Storage cache to reduce API calls
const storageCache = new Map<string, any>();

export const chromeDb = {
  async get<T>(key: keyof StorageData | string): Promise<T | null> {
    try {
      // Check cache first
      if (storageCache.has(key)) {
        console.log(`Cache hit for ${key}`);
        return storageCache.get(key);
      }

      console.log(`Fetching ${key} from chrome storage`);
      const result = await chrome.storage.sync.get(key);
      const value = result[key] || null;
      
      // Cache the result
      if (value !== null) {
        storageCache.set(key, value);
      }
      
      return value;
    } catch (error) {
      console.error(`Error reading ${key} from chrome storage:`, error);
      return null;
    }
  },

  async set(key: keyof StorageData | string, value: any): Promise<void> {
    try {
      console.log(`Setting ${key} in chrome storage`);
      await chrome.storage.sync.set({ [key]: value });
      storageCache.set(key, value);
    } catch (error) {
      console.error(`Error writing ${key} to chrome storage:`, error);
      throw error;
    }
  },

  async update(key: keyof StorageData | string, value: Partial<any>): Promise<void> {
    try {
      const current = await this.get(key);
      const updated = { ...current, ...value };
      await this.set(key, updated);
    } catch (error) {
      console.error(`Error updating ${key} in chrome storage:`, error);
      throw error;
    }
  },

  async remove(key: keyof StorageData | string): Promise<void> {
    try {
      console.log(`Removing ${key} from chrome storage`);
      await chrome.storage.sync.remove(key);
      storageCache.delete(key);
    } catch (error) {
      console.error(`Error removing ${key} from chrome storage:`, error);
      throw error;
    }
  },

  async getBytesInUse(): Promise<number> {
    try {
      return await chrome.storage.sync.getBytesInUse(null);
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return 0;
    }
  },

  async clearCache(): Promise<void> {
    storageCache.clear();
  },

  // Listen for storage changes
  listenToChanges(): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync') {
        for (const [key, { newValue }] of Object.entries(changes)) {
          console.log(`Storage changed for ${key}`);
          if (newValue === undefined) {
            storageCache.delete(key);
          } else {
            storageCache.set(key, newValue);
          }
        }
      }
    });
  }
};

// Initialize storage change listener
if (chrome.storage) {
  chromeDb.listenToChanges();
}
