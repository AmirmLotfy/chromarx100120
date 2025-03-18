
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
}

/**
 * Singleton instance of the unified storage service
 */
export const storage = new UnifiedStorage();

export default storage;
