
/**
 * Utility functions for working with chrome.storage
 */

/**
 * Get storage usage information
 */
export const getStorageUsage = async (): Promise<{
  bytesInUse: number;
  quotaBytes: number;
  percentUsed: number;
} | null> => {
  if (!chrome?.storage?.local) {
    console.warn('chrome.storage.local API not available');
    return null;
  }
  
  try {
    // Get bytes in use
    const bytesInUse = await new Promise<number>((resolve) => {
      chrome.storage.local.getBytesInUse(null, (bytes) => {
        resolve(bytes);
      });
    });
    
    // Get quota info
    const quotaBytes = chrome.storage.local.QUOTA_BYTES || 5242880; // Default Chrome quota is 5MB
    
    return {
      bytesInUse,
      quotaBytes,
      percentUsed: (bytesInUse / quotaBytes) * 100
    };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return null;
  }
};

/**
 * Get all keys in chrome.storage.local
 */
export const getAllStorageKeys = async (): Promise<string[]> => {
  if (!chrome?.storage?.local) {
    console.warn('chrome.storage.local API not available');
    return [];
  }
  
  try {
    const items = await new Promise<Record<string, any>>((resolve) => {
      chrome.storage.local.get(null, (items) => {
        resolve(items);
      });
    });
    
    return Object.keys(items);
  } catch (error) {
    console.error('Error getting storage keys:', error);
    return [];
  }
};

/**
 * Get all items in chrome.storage.local
 */
export const getAllStorageItems = async (): Promise<Record<string, any>> => {
  if (!chrome?.storage?.local) {
    console.warn('chrome.storage.local API not available');
    return {};
  }
  
  try {
    return await new Promise<Record<string, any>>((resolve) => {
      chrome.storage.local.get(null, (items) => {
        resolve(items);
      });
    });
  } catch (error) {
    console.error('Error getting storage items:', error);
    return {};
  }
};

/**
 * Clean up expired items in chrome.storage.local
 * Looks for items with expiration timestamps and removes them if expired
 */
export const cleanupExpiredItems = async (): Promise<number> => {
  if (!chrome?.storage?.local) {
    console.warn('chrome.storage.local API not available');
    return 0;
  }
  
  try {
    const items = await getAllStorageItems();
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    // Check each item for expiration
    for (const [key, value] of Object.entries(items)) {
      // Check for items with explicit expiration
      if (value && typeof value === 'object' && value.expiresAt && value.expiresAt < now) {
        keysToRemove.push(key);
        continue;
      }
      
      // Check for task results older than 2 days
      if (key.startsWith('task_result_') && value && typeof value === 'object' && value.completedAt) {
        const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);
        if (value.completedAt < twoDaysAgo) {
          keysToRemove.push(key);
        }
      }
      
      // Check for temp data older than 1 day
      if (key.startsWith('temp_') && value && typeof value === 'object' && value.createdAt) {
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        if (value.createdAt < oneDayAgo) {
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove expired items
    if (keysToRemove.length > 0) {
      await new Promise<void>((resolve) => {
        chrome.storage.local.remove(keysToRemove, () => {
          resolve();
        });
      });
    }
    
    return keysToRemove.length;
  } catch (error) {
    console.error('Error cleaning up expired items:', error);
    return 0;
  }
};

/**
 * Clear all data in chrome.storage.local
 */
export const clearStorage = async (): Promise<boolean> => {
  if (!chrome?.storage?.local) {
    console.warn('chrome.storage.local API not available');
    return false;
  }
  
  try {
    await new Promise<void>((resolve) => {
      chrome.storage.local.clear(() => {
        resolve();
      });
    });
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};

/**
 * Store data with expiration
 */
export const storeWithExpiration = async (
  key: string, 
  data: any, 
  expirationTimeMs: number
): Promise<boolean> => {
  if (!chrome?.storage?.local) {
    console.warn('chrome.storage.local API not available');
    return false;
  }
  
  try {
    const item = {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + expirationTimeMs
    };
    
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [key]: item }, () => {
        resolve();
      });
    });
    
    return true;
  } catch (error) {
    console.error('Error storing data with expiration:', error);
    return false;
  }
};

/**
 * Get data that might have expiration
 * Returns null if the data has expired
 */
export const getWithExpiration = async<T>(key: string): Promise<T | null> => {
  if (!chrome?.storage?.local) {
    console.warn('chrome.storage.local API not available');
    return null;
  }
  
  try {
    const result = await new Promise<Record<string, any>>((resolve) => {
      chrome.storage.local.get(key, (items) => {
        resolve(items);
      });
    });
    
    const item = result[key];
    
    // No data found
    if (!item) {
      return null;
    }
    
    // Check for expiration
    if (item.expiresAt && item.expiresAt < Date.now()) {
      // Auto-remove expired item
      chrome.storage.local.remove(key);
      return null;
    }
    
    // Return the actual data
    return item.data as T;
  } catch (error) {
    console.error('Error getting data with expiration:', error);
    return null;
  }
};

/**
 * Add a Bookmark object to the cache with indexing for faster lookup
 */
export const cacheBookmark = async (bookmark: any): Promise<boolean> => {
  if (!chrome?.storage?.local) {
    return false;
  }
  
  try {
    // Add to main bookmark storage
    const bookmarks = await getWithExpiration<any[]>('cached_bookmarks') || [];
    bookmarks.push(bookmark);
    
    // Store main bookmark collection
    await storeWithExpiration('cached_bookmarks', bookmarks, 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Index by ID for fast lookup
    await storeWithExpiration(
      `bookmark_${bookmark.id}`, 
      bookmark, 
      7 * 24 * 60 * 60 * 1000
    );
    
    return true;
  } catch (error) {
    console.error('Error caching bookmark:', error);
    return false;
  }
};

/**
 * Get a cached bookmark by ID
 */
export const getCachedBookmarkById = async (id: string): Promise<any | null> => {
  return getWithExpiration(`bookmark_${id}`);
};

/**
 * Store offline queue for synchronization when back online
 */
export const addToOfflineQueue = async (operation: any): Promise<boolean> => {
  if (!chrome?.storage?.local) {
    return false;
  }
  
  try {
    const queue = await getWithExpiration<any[]>('offline_queue') || [];
    queue.push({
      ...operation,
      timestamp: Date.now(),
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    
    // Store with 30-day expiration
    await storeWithExpiration('offline_queue', queue, 30 * 24 * 60 * 60 * 1000);
    return true;
  } catch (error) {
    console.error('Error adding to offline queue:', error);
    return false;
  }
};

/**
 * Get the current offline queue
 */
export const getOfflineQueue = async (): Promise<any[]> => {
  return await getWithExpiration<any[]>('offline_queue') || [];
};

/**
 * Clear the offline queue
 */
export const clearOfflineQueue = async (): Promise<boolean> => {
  if (!chrome?.storage?.local) {
    return false;
  }
  
  try {
    await chrome.storage.local.remove('offline_queue');
    return true;
  } catch (error) {
    console.error('Error clearing offline queue:', error);
    return false;
  }
};
