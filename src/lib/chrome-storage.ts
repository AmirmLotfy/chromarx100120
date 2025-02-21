
import { storage } from '@/services/storageService';

// Interface for UI preferences and settings that can sync across devices
export interface StorageData {
  settings: {
    dataCollection: boolean;
    experimentalFeatures: boolean;
    theme: 'light' | 'dark' | 'system';
    notifications: {
      bookmarks: boolean;
      updates: boolean;
      reminders: boolean;
    };
  };
  bookmarkPreferences: {
    defaultView: 'list' | 'grid';
    sortOrder: 'name' | 'date' | 'url';
    showFavicons: boolean;
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
        return 0;
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
