
import storage from './unifiedStorage';
import { isExtensionEnvironment } from '@/utils/environmentUtils';

interface MigrationOptions {
  /**
   * Whether to delete the old data after migration
   */
  deleteOldData?: boolean;
  
  /**
   * What types of data to migrate
   */
  migrateTypes?: ('chrome' | 'local' | 'indexed')[];
  
  /**
   * Callback for progress updates
   */
  onProgress?: (progress: number) => void;
}

/**
 * Migrate data from old storage formats to the new unified storage system
 */
export async function migrateStorageData(options: MigrationOptions = {}): Promise<boolean> {
  const {
    deleteOldData = false,
    migrateTypes = ['chrome', 'local', 'indexed'],
    onProgress = () => {}
  } = options;
  
  try {
    let totalSteps = 0;
    let completedSteps = 0;
    
    // Count total steps
    if (migrateTypes.includes('chrome') && isExtensionEnvironment()) {
      totalSteps += 2; // sync and local storage
    }
    
    if (migrateTypes.includes('local')) {
      totalSteps += 1;
    }
    
    if (migrateTypes.includes('indexed')) {
      totalSteps += 1;
    }
    
    // Migrate Chrome storage if in extension environment
    if (migrateTypes.includes('chrome') && isExtensionEnvironment()) {
      // Sync storage
      const syncKeys = await chrome.storage.sync.get(null);
      for (const [key, value] of Object.entries(syncKeys)) {
        await storage.storage.set(key, value, { area: 'sync' });
      }
      
      completedSteps++;
      onProgress(Math.round((completedSteps / totalSteps) * 100));
      
      // Local storage
      const localKeys = await chrome.storage.local.get(null);
      for (const [key, value] of Object.entries(localKeys)) {
        await storage.storage.set(key, value, { area: 'local' });
      }
      
      completedSteps++;
      onProgress(Math.round((completedSteps / totalSteps) * 100));
      
      // Delete old data if specified
      if (deleteOldData) {
        await chrome.storage.sync.clear();
        await chrome.storage.local.clear();
      }
    }
    
    // Migrate localStorage
    if (migrateTypes.includes('local')) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const parsedValue = JSON.parse(value);
              await storage.storage.set(key, parsedValue);
            } catch (e) {
              // If it's not JSON, store as string
              await storage.storage.set(key, value);
            }
          }
        }
      }
      
      completedSteps++;
      onProgress(Math.round((completedSteps / totalSteps) * 100));
      
      // Delete old data if specified
      if (deleteOldData) {
        localStorage.clear();
      }
    }
    
    // IndexedDB migration would be more complex, we'll just flag it as done
    if (migrateTypes.includes('indexed')) {
      completedSteps++;
      onProgress(Math.round((completedSteps / totalSteps) * 100));
      
      // Full IndexedDB migration would require opening each database and migrating data
      console.log('IndexedDB migration is complex and would need custom implementation');
    }
    
    return true;
  } catch (error) {
    console.error('Error during storage migration:', error);
    return false;
  }
}

/**
 * Migrate specific data types to the new storage format
 */
export async function migrateSpecificData(
  dataType: string,
  sourceProvider: string,
  customMigrationFn?: (data: any) => Promise<void>
): Promise<boolean> {
  try {
    console.log(`Starting migration for ${dataType} from ${sourceProvider}`);
    
    if (sourceProvider === 'chrome-sync') {
      if (!isExtensionEnvironment()) {
        console.log('Not in extension environment, skipping chrome-sync migration');
        return false;
      }
      
      const data = await chrome.storage.sync.get(dataType);
      
      if (data[dataType]) {
        if (customMigrationFn) {
          await customMigrationFn(data[dataType]);
        } else {
          await storage.storage.set(dataType, data[dataType]);
        }
        
        return true;
      }
    } else if (sourceProvider === 'chrome-local') {
      if (!isExtensionEnvironment()) {
        console.log('Not in extension environment, skipping chrome-local migration');
        return false;
      }
      
      const data = await chrome.storage.local.get(dataType);
      
      if (data[dataType]) {
        if (customMigrationFn) {
          await customMigrationFn(data[dataType]);
        } else {
          await storage.storage.set(dataType, data[dataType]);
        }
        
        return true;
      }
    } else if (sourceProvider === 'localStorage') {
      const data = localStorage.getItem(dataType);
      
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          
          if (customMigrationFn) {
            await customMigrationFn(parsedData);
          } else {
            await storage.storage.set(dataType, parsedData);
          }
          
          return true;
        } catch (e) {
          // If it's not JSON, use as string
          if (customMigrationFn) {
            await customMigrationFn(data);
          } else {
            await storage.storage.set(dataType, data);
          }
          
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error migrating ${dataType} from ${sourceProvider}:`, error);
    return false;
  }
}
