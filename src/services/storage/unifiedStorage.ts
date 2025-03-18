
import { IUnifiedStorage } from './types';
import { chromeStorageProvider } from './chromeStorageProvider';
import { indexedDbProvider } from './indexedDbProvider';
import { cacheManager } from './cacheManager';

/**
 * Unified storage service that provides a consistent API for all storage needs.
 * 
 * - Use `storage` for key-value storage (preferences, settings, small data)
 * - Use `db` for larger data sets and structured data (bookmarks, history)
 * - Use `cache` for temporary data that needs to be accessed frequently
 */
class UnifiedStorage implements IUnifiedStorage {
  storage = chromeStorageProvider;
  db = indexedDbProvider;
  cache = cacheManager;
  
  /**
   * Initialize the storage system
   */
  async initialize(): Promise<void> {
    // Any initialization logic can go here
    console.log('Unified storage system initialized');
  }

  /**
   * Proxy method for chromeStorageProvider.set
   * This allows direct usage of storage.set
   */
  async set(key: string, value: any): Promise<void> {
    await this.storage.set(key, value);
  }

  /**
   * Proxy method for chromeStorageProvider.get
   * This allows direct usage of storage.get
   */
  async get(key: string): Promise<any> {
    return this.storage.get(key);
  }

  /**
   * Proxy method for chromeStorageProvider.remove
   * This allows direct usage of storage.remove
   */
  async remove(key: string): Promise<void> {
    await this.storage.remove(key);
  }

  /**
   * Proxy method for chromeStorageProvider.clear
   * This allows direct usage of storage.clear
   */
  async clear(): Promise<void> {
    await this.storage.clear();
  }
}

/**
 * Singleton instance of the unified storage service
 */
export const storage = new UnifiedStorage();

export default storage;
