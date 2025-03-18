
import { ICacheManager } from './types';

export class CacheManager implements ICacheManager {
  private memoryCache: Map<string, { value: any; expiry: number | null }> = new Map();
  
  /**
   * Get an item from the cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if the entry has expired
    if (entry.expiry && entry.expiry < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }
  
  /**
   * Set an item in the cache
   */
  async set<T>(key: string, value: T, ttlMinutes?: number): Promise<void> {
    this.memoryCache.set(key, {
      value,
      expiry: ttlMinutes ? Date.now() + ttlMinutes * 60 * 1000 : null
    });
  }
  
  /**
   * Remove an item from the cache
   */
  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }
  
  /**
   * Clear the entire cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
  }
  
  /**
   * Get an item from the cache or fetch it if not present
   */
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
      throw error;
    }
  }
}

export const cacheManager = new CacheManager();
