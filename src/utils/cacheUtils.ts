
import { storage } from "@/services/storageService";

interface CacheConfig {
  ttl: number;
  prefix?: string;
}

interface CacheItem<T> {
  value: T;
  timestamp: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes default TTL
    prefix: 'cache_'
  };

  private constructor() {}

  static getInstance(): CacheService {
    if (!this.instance) {
      this.instance = new CacheService();
    }
    return this.instance;
  }

  configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private getCacheKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.config.ttl;
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryCache = this.cache.get(key);
    if (memoryCache && !this.isExpired(memoryCache.timestamp)) {
      return memoryCache.value;
    }

    // Try persistent storage
    try {
      const stored = await storage.get<CacheItem<T>>(this.getCacheKey(key));
      if (stored && !this.isExpired(stored.timestamp)) {
        // Update memory cache
        this.cache.set(key, stored);
        return stored.value;
      }
    } catch (error) {
      console.warn('Error reading from cache:', error);
    }

    return null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now()
    };

    // Update memory cache
    this.cache.set(key, item);

    // Update persistent storage
    try {
      await storage.set(this.getCacheKey(key), item);
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }

  async invalidate(key: string): Promise<void> {
    // Clear memory cache
    this.cache.delete(key);

    // Clear persistent storage
    try {
      await storage.remove(this.getCacheKey(key));
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  async clear(): Promise<void> {
    // Clear memory cache
    this.cache.clear();

    // Clear all cached items from persistent storage
    try {
      const allKeys = await storage.get<string[]>('cacheKeys');
      if (allKeys) {
        await Promise.all(allKeys.map(key => storage.remove(key)));
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async primeCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const fresh = await fetchFn();
    await this.set(key, fresh);
    return fresh;
  }
}

export const cache = CacheService.getInstance();
