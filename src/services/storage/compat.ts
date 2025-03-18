
import storage from './unifiedStorage';

/**
 * Compatibility layer for existing code that uses the old storage APIs
 */

// Compatibility with chromeDb
export const chromeDb = {
  get: async <T>(key: string, storageArea: string = 'sync'): Promise<T | null> => {
    return storage.storage.get<T>(key, { area: storageArea as any });
  },
  
  set: async <T>(key: string, value: T, storageArea: string = 'sync'): Promise<void> => {
    await storage.storage.set<T>(key, value, { area: storageArea as any });
  },
  
  update: async <T extends Record<string, any>>(
    key: string, 
    value: Partial<T>, 
    storageArea: string = 'sync'
  ): Promise<void> => {
    await storage.storage.update<T>(key, value, { area: storageArea as any });
  },
  
  remove: async (key: string, storageArea: string = 'sync'): Promise<void> => {
    await storage.storage.remove(key, { area: storageArea as any });
  },
  
  // All other methods are proxied to the unified storage API
  clearCache: () => {
    storage.cache.clear();
  },
  
  getBytesInUse: async (storageArea: string = 'sync'): Promise<number> => {
    // This is an approximation
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.[storageArea]) {
        return await chrome.storage[storageArea].getBytesInUse(null);
      }
      
      // Approximate localStorage usage
      return Object.keys(localStorage).reduce((total, key) => {
        return total + (localStorage.getItem(key)?.length || 0) * 2;
      }, 0);
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return 0;
    }
  },
  
  listenToChanges: () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        console.log(`Storage changes detected in ${areaName}:`, changes);
        
        if (areaName === 'sync' || areaName === 'local') {
          for (const [key, { newValue, oldValue }] of Object.entries(changes)) {
            // If a key is removed, clear it from cache
            if (newValue === undefined) {
              storage.cache.remove(key);
            }
            
            // Dispatch custom event for components to listen to
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('storage-changed', {
                detail: { key, newValue, oldValue, area: areaName }
              }));
            }
          }
        }
      });
    }
  },
  
  isExtensionContext: (): boolean => {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
  },
  
  getMaxStorageSize: async (storageArea: string = 'sync'): Promise<number> => {
    // Chrome sync storage has a quota of 102,400 bytes (100KB) per item
    // and a total quota of 8,192,000 bytes (8MB)
    if (storageArea === 'sync') return 8192000;
    
    // Chrome local storage has a quota of 5,242,880 bytes (5MB)
    return 5242880;
  }
};

// Simple compatibility layer for existing localStorage references
export const localStorageCompat = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in localStorage:', error);
    }
  },
  
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
    }
  }
};

// Legacy storage service compatibility
export const storageService = {
  get: async <T>(key: string): Promise<T | null> => {
    return storage.storage.get<T>(key);
  },
  
  set: async <T>(key: string, value: T): Promise<void> => {
    await storage.storage.set<T>(key, value);
  },
  
  update: async <T extends Record<string, any>>(key: string, value: Partial<T>): Promise<void> => {
    await storage.storage.update<T>(key, value);
  },
  
  remove: async (key: string): Promise<void> => {
    await storage.storage.remove(key);
  },
  
  getInstance: () => {
    return storageService;
  }
};
