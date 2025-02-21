
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
  set: async <T>(key: StorageKey, value: T): Promise<void> => storage.set(key, value),
  update: async <T extends Record<string, any>>(key: StorageKey, value: Partial<T>): Promise<void> => storage.update(key, value),
  remove: storage.remove.bind(storage),
  signOut: storage.signOut.bind(storage),
  getBytesInUse: async (): Promise<number> => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage?.sync) {
        // Return estimated localStorage usage if not in extension
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

// Initialize storage change listener
if (typeof chrome !== 'undefined' && chrome.storage) {
  chromeDb.listenToChanges();
}
