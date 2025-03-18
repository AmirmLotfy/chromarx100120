
import { storage } from '@/services/storage/unifiedStorage';
import { toast } from 'sonner';

export type CachePriority = 'high' | 'normal' | 'low';
export type CacheSource = 'memory' | 'indexedDb' | 'chromeStorage';

export interface CacheOptions {
  /** Time to live in minutes */
  ttl?: number;
  /** Priority for retention during cache cleanup */
  priority?: CachePriority;
  /** Force fetch fresh data even if cached */
  forceRefresh?: boolean;
  /** Preferred storage source */
  preferredSource?: CacheSource;
  /** Whether to store in memory for faster access */
  cacheInMemory?: boolean;
  /** Cache data even if there's an error */
  cacheErrors?: boolean;
  /** Version tag for cache invalidation */
  version?: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number | null;
  priority: CachePriority;
  source: CacheSource;
  version?: string;
  error?: boolean;
  id?: string;
}

const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  ttl: 60, // 1 hour
  priority: 'normal',
  forceRefresh: false,
  preferredSource: 'indexedDb',
  cacheInMemory: true,
  cacheErrors: false,
  version: '1.0'
};

class UnifiedCacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private isOffline = false;

  constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      this.isOffline = !navigator.onLine;
    }
  }

  private handleOnline = () => {
    this.isOffline = false;
    console.log('Cache manager: Online mode');
    
    // Notify components that we're back online
    window.dispatchEvent(new CustomEvent('cache-manager-online'));
  };

  private handleOffline = () => {
    this.isOffline = true;
    console.log('Cache manager: Offline mode');
    
    // Notify components that we're offline
    window.dispatchEvent(new CustomEvent('cache-manager-offline'));
  };

  /**
   * Get data from cache or fetch it if not present
   */
  async getData<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const opts = { ...DEFAULT_CACHE_OPTIONS, ...options };
    
    // If not forcing refresh, try to get from cache first
    if (!opts.forceRefresh) {
      // Check memory cache first (fastest)
      if (opts.cacheInMemory) {
        const memoryData = this.getFromMemoryCache<T>(key, opts);
        if (memoryData !== null) {
          console.log(`Cache hit (memory): ${key}`);
          return memoryData;
        }
      }
      
      // Then check persistent storage
      try {
        const persistentData = await this.getFromPersistentCache<T>(key, opts);
        if (persistentData !== null) {
          // Cache in memory for faster access next time
          if (opts.cacheInMemory) {
            this.setInMemoryCache(key, persistentData, opts);
          }
          console.log(`Cache hit (${opts.preferredSource}): ${key}`);
          return persistentData;
        }
      } catch (error) {
        console.error(`Error retrieving from cache: ${key}`, error);
      }
    }
    
    // If we're offline and no cached data, throw error
    if (this.isOffline) {
      toast.error("You're offline. Cannot fetch fresh data.");
      throw new Error('Cannot fetch data while offline');
    }
    
    // If we reach here, we need to fetch fresh data
    try {
      console.log(`Cache miss: ${key}`);
      const freshData = await fetchFn();
      
      // Cache the fresh data
      await this.cacheData(key, freshData, opts);
      
      return freshData;
    } catch (error) {
      console.error(`Error fetching data: ${key}`, error);
      
      // If caching errors is enabled, store the error state
      if (opts.cacheErrors) {
        // Use a special value to indicate error
        const errorEntry: CacheEntry<any> = {
          data: null,
          timestamp: Date.now(),
          expiry: Date.now() + (opts.ttl || 5) * 60 * 1000, // Shorter TTL for errors
          priority: 'low',
          source: 'memory',
          version: opts.version,
          error: true
        };
        
        this.memoryCache.set(key, errorEntry);
      }
      
      throw error;
    }
  }

  /**
   * Pre-cache data for later use
   */
  async preCacheData<T>(
    key: string, 
    data: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    await this.cacheData(key, data, options);
  }

  /**
   * Invalidate cache by key
   */
  async invalidateCache(key: string): Promise<void> {
    // Remove from memory cache
    this.memoryCache.delete(key);
    
    // Remove from persistent storage
    try {
      await storage.db.delete(`cache_${key}`, { storeName: 'cache' });
    } catch (error) {
      console.error(`Error invalidating cache: ${key}`, error);
    }
  }

  /**
   * Invalidate all caches
   */
  async invalidateAllCaches(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear persistent storage
    try {
      await storage.db.clear({ storeName: 'cache' });
      toast.success('All caches cleared');
    } catch (error) {
      console.error('Error invalidating all caches', error);
      toast.error('Failed to clear caches');
    }
  }

  /**
   * Invalidate caches by prefix
   */
  async invalidateCachesByPrefix(prefix: string): Promise<void> {
    // Clear matching items from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clear matching items from persistent storage
    try {
      const allCacheItems = await storage.db.getAll({ storeName: 'cache' }) as Array<{ id?: string }>;
      
      for (const item of allCacheItems) {
        if (item.id && item.id.startsWith(`cache_${prefix}`)) {
          await storage.db.delete(item.id, { storeName: 'cache' });
        }
      }
    } catch (error) {
      console.error(`Error invalidating caches by prefix: ${prefix}`, error);
    }
  }

  /**
   * Check if we're in offline mode
   */
  isInOfflineMode(): boolean {
    return this.isOffline;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    memoryEntries: number;
    persistentEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  }> {
    try {
      const allCacheItems = await storage.db.getAll({ storeName: 'cache' }) as Array<{ timestamp?: number }>;
      
      let oldest = Date.now();
      let newest = 0;
      
      for (const item of allCacheItems) {
        if (item.timestamp && item.timestamp < oldest) oldest = item.timestamp;
        if (item.timestamp && item.timestamp > newest) newest = item.timestamp;
      }
      
      return {
        memoryEntries: this.memoryCache.size,
        persistentEntries: allCacheItems.length,
        oldestEntry: allCacheItems.length > 0 ? oldest : null,
        newestEntry: allCacheItems.length > 0 ? newest : null
      };
    } catch (error) {
      console.error('Error getting cache stats', error);
      
      return {
        memoryEntries: this.memoryCache.size,
        persistentEntries: 0,
        oldestEntry: null,
        newestEntry: null
      };
    }
  }

  // Private helper methods
  
  private getFromMemoryCache<T>(key: string, options: CacheOptions): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) return null;
    
    // Check for version mismatch
    if (options.version && entry.version !== options.version) {
      this.memoryCache.delete(key);
      return null;
    }
    
    // Check if entry has expired
    if (entry.expiry && entry.expiry < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    
    // If this was an error entry, don't return it
    if (entry.error) {
      return null;
    }
    
    return entry.data as T;
  }

  private async getFromPersistentCache<T>(key: string, options: CacheOptions): Promise<T | null> {
    try {
      const entry = await storage.db.get(`cache_${key}`, { storeName: 'cache' }) as CacheEntry<T> | null;
      
      if (!entry) return null;
      
      // Check for version mismatch
      if (options.version && entry.version !== options.version) {
        await storage.db.delete(`cache_${key}`, { storeName: 'cache' });
        return null;
      }
      
      // Check if entry has expired
      if (entry.expiry && entry.expiry < Date.now()) {
        await storage.db.delete(`cache_${key}`, { storeName: 'cache' });
        return null;
      }
      
      // If this was an error entry, don't return it
      if (entry.error) {
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.error(`Error getting from persistent cache: ${key}`, error);
      return null;
    }
  }

  private setInMemoryCache<T>(key: string, data: T, options: CacheOptions): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: options.ttl ? Date.now() + options.ttl * 60 * 1000 : null,
      priority: options.priority || 'normal',
      source: 'memory',
      version: options.version
    };
    
    this.memoryCache.set(key, entry);
  }

  private async cacheData<T>(key: string, data: T, options: CacheOptions): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: options.ttl ? Date.now() + options.ttl * 60 * 1000 : null,
      priority: options.priority || 'normal',
      source: options.preferredSource || 'indexedDb',
      version: options.version
    };
    
    // Cache in memory if enabled
    if (options.cacheInMemory) {
      this.memoryCache.set(key, entry);
    }
    
    // Cache in persistent storage
    try {
      await storage.db.add(`cache_${key}`, entry, { storeName: 'cache' });
    } catch (error) {
      // If item already exists, update it instead
      if ((error as any)?.name === 'ConstraintError') {
        await storage.db.update(`cache_${key}`, entry, { storeName: 'cache' });
      } else {
        console.error(`Error caching data: ${key}`, error);
      }
    }
  }
}

export const unifiedCache = new UnifiedCacheManager();
export default unifiedCache;
