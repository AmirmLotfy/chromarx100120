
import { storage } from '@/services/storageService';
import { toast } from 'sonner';
import { retryWithBackoff } from '@/utils/retryUtils';

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
type StorageArea = 'sync' | 'local';

export const chromeDb = {
  // Get a value from storage
  get: async <T>(key: StorageKey, storageArea: StorageArea = 'sync'): Promise<T | null> => {
    try {
      return await retryWithBackoff(
        async () => storage.get<T>(key),
        { maxRetries: 2, initialDelay: 500 }
      );
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  },

  // Set a value in storage
  set: async <T>(key: StorageKey, value: T, storageArea: StorageArea = 'sync'): Promise<void> => {
    try {
      await retryWithBackoff(
        async () => storage.set(key, value),
        { maxRetries: 2, initialDelay: 500 }
      );
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      
      // Check for quota errors which are common in extension storage
      if (error instanceof Error && error.message.includes('quota')) {
        toast.error('Storage quota exceeded. Consider clearing some data.');
      }
    }
  },

  // Update a partial object in storage
  update: async <T extends Record<string, any>>(
    key: StorageKey, 
    value: Partial<T>, 
    storageArea: StorageArea = 'sync'
  ): Promise<void> => {
    try {
      await retryWithBackoff(
        async () => storage.update(key, value),
        { maxRetries: 2, initialDelay: 500 }
      );
    } catch (error) {
      console.error(`Error updating ${key} in storage:`, error);
      
      // If quota exceeded, try to remove some non-essential data
      if (error instanceof Error && error.message.includes('quota')) {
        toast.error('Storage quota exceeded. Consider clearing some data.');
      }
    }
  },

  // Remove a key from storage
  remove: async (key: StorageKey, storageArea: StorageArea = 'sync'): Promise<void> => {
    try {
      await storage.remove(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
    }
  },

  // Get bytes in use
  getBytesInUse: async (storageArea: StorageArea = 'sync'): Promise<number> => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage?.[storageArea]) {
        // Return estimated localStorage usage if not in extension
        return Object.keys(localStorage).reduce((total, key) => {
          return total + (localStorage.getItem(key)?.length || 0) * 2; // Approximate bytes
        }, 0);
      }
      
      return await chrome.storage[storageArea].getBytesInUse(null);
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return 0;
    }
  },

  // Clear the storage cache
  clearCache: storage.clearCache.bind(storage),

  // Listen to storage changes
  listenToChanges: () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        console.log(`Storage changes detected in ${areaName}:`, changes);
        
        if (areaName === 'sync' || areaName === 'local') {
          for (const [key, { newValue, oldValue }] of Object.entries(changes)) {
            // If a key is removed, clear it from cache
            if (newValue === undefined) {
              storage.clearCache();
            }
            
            // Dispatch custom event for components to listen to
            window.dispatchEvent(new CustomEvent('storage-changed', {
              detail: { key, newValue, oldValue, area: areaName }
            }));
          }
        }
      });
      
      console.log('Storage change listener initialized');
    }
  },

  // Check if we're in a Chrome extension context
  isExtensionContext: (): boolean => {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
  },
  
  // Get maximum storage size in bytes
  getMaxStorageSize: async (storageArea: StorageArea = 'sync'): Promise<number> => {
    // Chrome sync storage has a quota of 102,400 bytes (100KB) per item
    // and a total quota of 8,192,000 bytes (8MB)
    if (storageArea === 'sync') return 8192000;
    
    // Chrome local storage has a quota of 5,242,880 bytes (5MB)
    return 5242880;
  }
};

// Initialize storage change listener
if (typeof chrome !== 'undefined' && chrome.storage) {
  chromeDb.listenToChanges();
}
