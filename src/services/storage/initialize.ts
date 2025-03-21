
import storage from './unifiedStorage';
import { isExtensionEnvironment } from '@/utils/environmentUtils';
import { chromeDb } from './compat';
import serviceWorkerController from '@/services/serviceWorkerController';

/**
 * Initialize the storage system at application startup
 */
export async function initializeStorage(): Promise<void> {
  try {
    // Initialize the unified storage system
    await storage.initialize();
    
    // Set up Chrome storage change listeners if in extension environment
    if (isExtensionEnvironment()) {
      chromeDb.listenToChanges();
    }
    
    // Initialize the service worker controller
    await serviceWorkerController.initialize();
    
    console.log('Storage system successfully initialized');
  } catch (error) {
    console.error('Error initializing storage system:', error);
  }
}

// Auto-initialize when this file is imported
initializeStorage().catch(console.error);

export default storage;
