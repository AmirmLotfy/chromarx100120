import { storage } from '@/services/storageService';

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

type StorageKey = keyof StorageData | string;

export const chromeDb = {
  get: async <T>(key: StorageKey): Promise<T | null> => storage.get<T>(key),
  set: async <T>(key: StorageKey, value: T): Promise<void> => {
    try {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && 'id' in value[0]) {
        const versionedValue = value.map((item: any) => {
          if (!item.version) {
            return { ...item, version: 1 };
          }
          return item;
        });
        
        await storage.set(key, versionedValue);
      } else {
        await storage.set(key, value);
      }
    } catch (error) {
      console.error('Error writing to chrome storage:', error);
      throw error;
    }
  },
  update: async <T extends Record<string, any>>(key: StorageKey, value: Partial<T>): Promise<void> => storage.update(key, value),
  remove: storage.remove.bind(storage),
  updateWithVersion: async <T extends { id: string; version?: number }>(
    key: StorageKey,
    item: T
  ): Promise<{success: boolean; conflict?: boolean}> => {
    try {
      const allItems = await storage.get<T[]>(key as string) || [];
      const existingIndex = allItems.findIndex(i => 'id' in i && i.id === item.id);
      
      if (existingIndex >= 0) {
        const existing = allItems[existingIndex] as T;
        const existingVersion = existing.version || 1;
        const newVersion = item.version || 1;
        
        if (existingVersion > newVersion) {
          return { success: false, conflict: true };
        }
        
        allItems[existingIndex] = {
          ...item,
          version: newVersion
        };
      } else {
        allItems.push({
          ...item,
          version: item.version || 1
        });
      }
      
      await storage.set(key, allItems);
      return { success: true };
    } catch (error) {
      console.error(`Error updating ${key} with version:`, error);
      return { success: false };
    }
  },
  getBytesInUse: async (): Promise<number> => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage?.sync) {
        return Object.keys(localStorage).reduce((total, key) => {
          return total + (localStorage.getItem(key)?.length || 0) * 2; // Approximate bytes
        }, 0);
      }
      return await chrome.storage.sync.getBytesInUse(null);
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return 0;
    }
  },
  clearCache: storage.clearCache.bind(storage),
  listenToChanges: () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync') {
          for (const [key, { newValue }] of Object.entries(changes)) {
            if (newValue === undefined) {
              storage.clearCache();
            }
          }
        }
      });
    }
  }
};

if (typeof chrome !== 'undefined' && chrome.storage) {
  chromeDb.listenToChanges();
}
