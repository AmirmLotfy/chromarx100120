
/**
 * Chrome Storage Utilities
 * Helper functions for working with chrome.storage.local API
 */

// Default ttl (time to live) for cached items in milliseconds
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Chrome storage item with expiration
 */
interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry?: number; // Expiration timestamp
}

/**
 * Get a value from chrome.storage.local
 */
export async function getStorageItem<T>(
  key: string, 
  defaultValue: T | null = null
): Promise<T | null> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    console.warn('chrome.storage.local API not available');
    return defaultValue;
  }
  
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting item from storage:', chrome.runtime.lastError);
        resolve(defaultValue);
        return;
      }
      
      const item = result[key] as StorageItem<T> | undefined;
      
      // If item doesn't exist, return default
      if (!item) {
        resolve(defaultValue);
        return;
      }
      
      // Check if item has expired
      if (item.expiry && Date.now() > item.expiry) {
        // Item has expired, remove it and return default
        chrome.storage.local.remove(key);
        resolve(defaultValue);
        return;
      }
      
      resolve(item.value);
    });
  });
}

/**
 * Set a value in chrome.storage.local with optional TTL
 */
export async function setStorageItem<T>(
  key: string, 
  value: T, 
  ttl: number | null = DEFAULT_TTL
): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    console.warn('chrome.storage.local API not available');
    return false;
  }
  
  return new Promise((resolve) => {
    const storageItem: StorageItem<T> = {
      value,
      timestamp: Date.now(),
      expiry: ttl ? Date.now() + ttl : undefined
    };
    
    chrome.storage.local.set({ [key]: storageItem }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error setting item in storage:', chrome.runtime.lastError);
        resolve(false);
        return;
      }
      
      resolve(true);
    });
  });
}

/**
 * Remove a value from chrome.storage.local
 */
export async function removeStorageItem(key: string): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    console.warn('chrome.storage.local API not available');
    return false;
  }
  
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, () => {
      if (chrome.runtime.lastError) {
        console.error('Error removing item from storage:', chrome.runtime.lastError);
        resolve(false);
        return;
      }
      
      resolve(true);
    });
  });
}

/**
 * Clear all values from chrome.storage.local
 */
export async function clearStorage(): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    console.warn('chrome.storage.local API not available');
    return false;
  }
  
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        console.error('Error clearing storage:', chrome.runtime.lastError);
        resolve(false);
        return;
      }
      
      resolve(true);
    });
  });
}

/**
 * Get multiple values from chrome.storage.local
 */
export async function getStorageItems<T>(
  keys: string[]
): Promise<Record<string, T | null>> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    console.warn('chrome.storage.local API not available');
    return keys.reduce((acc, key) => ({ ...acc, [key]: null }), {});
  }
  
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting items from storage:', chrome.runtime.lastError);
        resolve(keys.reduce((acc, key) => ({ ...acc, [key]: null }), {}));
        return;
      }
      
      const output: Record<string, T | null> = {};
      
      // Process each key
      for (const key of keys) {
        const item = result[key] as StorageItem<T> | undefined;
        
        // If item doesn't exist or has expired, set to null
        if (!item || (item.expiry && Date.now() > item.expiry)) {
          output[key] = null;
          
          // Clean up expired items
          if (item && item.expiry && Date.now() > item.expiry) {
            chrome.storage.local.remove(key);
          }
        } else {
          output[key] = item.value;
        }
      }
      
      resolve(output);
    });
  });
}

/**
 * Set multiple values in chrome.storage.local with optional TTL
 */
export async function setStorageItems<T>(
  items: Record<string, T>,
  ttl: number | null = DEFAULT_TTL
): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    console.warn('chrome.storage.local API not available');
    return false;
  }
  
  return new Promise((resolve) => {
    const storageItems: Record<string, StorageItem<T>> = {};
    
    // Prepare each item
    for (const [key, value] of Object.entries(items)) {
      storageItems[key] = {
        value: value as T,
        timestamp: Date.now(),
        expiry: ttl ? Date.now() + ttl : undefined
      };
    }
    
    chrome.storage.local.set(storageItems, () => {
      if (chrome.runtime.lastError) {
        console.error('Error setting items in storage:', chrome.runtime.lastError);
        resolve(false);
        return;
      }
      
      resolve(true);
    });
  });
}

/**
 * Get storage usage information
 */
export async function getStorageUsage(): Promise<{
  bytesInUse: number;
  quotaBytes: number;
  percentUsed: number;
} | null> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    console.warn('chrome.storage.local API not available');
    return null;
  }
  
  return new Promise((resolve) => {
    chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting storage usage:', chrome.runtime.lastError);
        resolve(null);
        return;
      }
      
      const quotaBytes = chrome.storage.local.QUOTA_BYTES || 5 * 1024 * 1024; // Default 5MB
      
      resolve({
        bytesInUse,
        quotaBytes,
        percentUsed: (bytesInUse / quotaBytes) * 100
      });
    });
  });
}

/**
 * Listen for storage changes
 */
export function listenForStorageChanges(
  callback: (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void
): () => void {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    console.warn('chrome.storage API not available');
    return () => {};
  }
  
  chrome.storage.onChanged.addListener(callback);
  
  // Return a cleanup function
  return () => {
    chrome.storage.onChanged.removeListener(callback);
  };
}

/**
 * Clean up expired items in storage
 */
export async function cleanupExpiredItems(): Promise<number> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    console.warn('chrome.storage.local API not available');
    return 0;
  }
  
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting items for cleanup:', chrome.runtime.lastError);
        resolve(0);
        return;
      }
      
      const now = Date.now();
      const keysToRemove: string[] = [];
      
      // Find expired items
      for (const [key, value] of Object.entries(items)) {
        const item = value as StorageItem<unknown>;
        
        if (item && item.expiry && now > item.expiry) {
          keysToRemove.push(key);
        }
      }
      
      // If no expired items, resolve immediately
      if (keysToRemove.length === 0) {
        resolve(0);
        return;
      }
      
      // Remove expired items
      chrome.storage.local.remove(keysToRemove, () => {
        if (chrome.runtime.lastError) {
          console.error('Error removing expired items:', chrome.runtime.lastError);
          resolve(0);
          return;
        }
        
        resolve(keysToRemove.length);
      });
    });
  });
}

/**
 * Get all keys in storage
 */
export async function getAllStorageKeys(): Promise<string[]> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    console.warn('chrome.storage.local API not available');
    return [];
  }
  
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting all keys:', chrome.runtime.lastError);
        resolve([]);
        return;
      }
      
      resolve(Object.keys(items));
    });
  });
}
