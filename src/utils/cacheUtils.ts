
// If the file doesn't exist, create it with basic cache functionality

interface CacheEntry<T> {
  value: T;
  expiry: number | null;
}

class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  
  private async getStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return chrome.storage.local;
    }
    return null;
  }

  private getMemoryCache<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) return null;
    
    // Check if entry has expired
    if (entry.expiry && entry.expiry < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  async get<T>(key: string): Promise<T | null> {
    // First check memory cache for performance
    const memoryResult = this.getMemoryCache<T>(key);
    if (memoryResult !== null) return memoryResult;
    
    // Then check persistent storage
    try {
      const storage = await this.getStorage();
      
      if (storage) {
        const result = await storage.get([key]);
        if (result[key]) {
          const entry = result[key] as CacheEntry<T>;
          
          // Check if entry has expired
          if (entry.expiry && entry.expiry < Date.now()) {
            await storage.remove(key);
            return null;
          }
          
          // Cache in memory for faster access next time
          this.memoryCache.set(key, entry);
          
          return entry.value;
        }
      } else {
        // Fallback to localStorage for non-extension environments
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item) as CacheEntry<T>;
          
          // Check if entry has expired
          if (parsed.expiry && parsed.expiry < Date.now()) {
            localStorage.removeItem(key);
            return null;
          }
          
          // Cache in memory for faster access next time
          this.memoryCache.set(key, parsed);
          
          return parsed.value;
        }
      }
    } catch (error) {
      console.error('Error getting from cache:', error);
    }
    
    return null;
  }

  async set<T>(key: string, value: T, ttlMinutes?: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        value, 
        expiry: ttlMinutes ? Date.now() + ttlMinutes * 60 * 1000 : null
      };
      
      // Always update memory cache
      this.memoryCache.set(key, entry);
      
      const storage = await this.getStorage();
      
      if (storage) {
        await storage.set({ [key]: entry });
      } else {
        // Fallback to localStorage
        localStorage.setItem(key, JSON.stringify(entry));
      }
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    try {
      const storage = await this.getStorage();
      
      if (storage) {
        await storage.remove(key);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing from cache:', error);
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    try {
      const storage = await this.getStorage();
      
      if (storage) {
        await storage.clear();
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async primeCache<T>(key: string, fetchDataFn: () => Promise<T>, ttlMinutes?: number): Promise<T> {
    // First try to get from cache
    const cachedData = await this.get<T>(key);
    if (cachedData !== null) {
      return cachedData;
    }
    
    // If not in cache, fetch fresh data
    try {
      const freshData = await fetchDataFn();
      
      // Store in cache for future use
      await this.set(key, freshData, ttlMinutes);
      
      return freshData;
    } catch (error) {
      console.error('Error fetching data for cache:', error);
      throw error; // Re-throw to let caller handle the error
    }
  }

  // Load dummy data immediately in non-extension context
  preloadDummyData<T>(key: string, dummyData: T): void {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      const entry: CacheEntry<T> = {
        value: dummyData,
        expiry: null
      };
      this.memoryCache.set(key, entry);
      localStorage.setItem(key, JSON.stringify(entry));
    }
  }
}

export const cache = new CacheManager();
