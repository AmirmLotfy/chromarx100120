// This is a minimal implementation for testing purposes
// The actual implementation would interact with Chrome storage

interface StorageService {
  get: <T>(key: string) => Promise<T>;
  set: <T>(key: string, value: T) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clearCache: () => Promise<void>;
  populateTestData: () => Promise<void>;
}

// Create a simple in-memory storage for testing in web environment
const createWebStorage = (): StorageService => {
  const storage = localStorage;

  return {
    get: async <T>(key: string): Promise<T> => {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : null;
    },
    set: async <T>(key: string, value: T): Promise<void> => {
      storage.setItem(key, JSON.stringify(value));
    },
    remove: async (key: string): Promise<void> => {
      storage.removeItem(key);
    },
    clearCache: async (): Promise<void> => {
      // Only clear extension-related data, not all localStorage
      const keysToPreserve = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && !key.startsWith('_extension_')) {
          keysToPreserve.push(key);
        }
      }
      
      storage.clear();
      
      // Restore non-extension keys
      keysToPreserve.forEach(key => {
        const value = storage.getItem(key);
        if (value) storage.setItem(key, value);
      });
    },
    populateTestData: async (): Promise<void> => {
      // Add subscription data
      await storage.setItem('user_subscription', JSON.stringify({
        planId: 'free',
        status: 'active'
      }));
      
      // Add usage data
      await storage.setItem('usage', JSON.stringify({
        bookmarks: { used: 3, limit: 5, percentage: 60 },
        notes: { used: 1, limit: 2, percentage: 50 },
        aiRequests: { used: 5, limit: 10, percentage: 50 },
        tasks: { used: 2, limit: 5, percentage: 40 }
      }));
    }
  };
};

// Determine if we're in a Chrome extension environment
const isExtensionEnvironment = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

// Use the appropriate storage implementation
export const storage: StorageService = isExtensionEnvironment 
  ? (window as any).storage /* This would be provided by the actual extension */
  : createWebStorage();
