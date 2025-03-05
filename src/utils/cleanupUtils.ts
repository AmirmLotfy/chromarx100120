
/**
 * Utilities for proper cleanup when extension is disabled or uninstalled
 */
import { logger, createNamespacedLogger } from './loggerUtils';
import { storage } from '@/services/storageService';

const cleanupLogger = createNamespacedLogger('Cleanup');

/**
 * Data types that can be cleaned up on uninstall
 */
export type CleanupDataType = 
  | 'all' 
  | 'bookmarks' 
  | 'settings' 
  | 'user' 
  | 'history' 
  | 'cache';

/**
 * Perform data cleanup based on specified data types
 */
export const cleanupData = async (dataTypes: CleanupDataType[] = ['all']) => {
  try {
    cleanupLogger.info(`Starting cleanup for data types: ${dataTypes.join(', ')}`);
    
    const cleanAll = dataTypes.includes('all');
    
    // Clear storage based on data types
    if (cleanAll || dataTypes.includes('settings')) {
      await storage.remove('settings');
      cleanupLogger.info('Settings data cleared');
    }
    
    if (cleanAll || dataTypes.includes('user')) {
      await storage.remove('user');
      await storage.remove('user_subscription');
      cleanupLogger.info('User data cleared');
    }
    
    if (cleanAll || dataTypes.includes('history')) {
      await storage.remove('history');
      cleanupLogger.info('History data cleared');
    }
    
    if (cleanAll || dataTypes.includes('cache')) {
      storage.clearCache();
      cleanupLogger.info('Cache cleared');
    }
    
    cleanupLogger.info('Cleanup completed successfully');
    return { success: true };
  } catch (error) {
    return cleanupLogger.handleExtensionError('Error during data cleanup', error);
  }
};

/**
 * Register uninstall handler for Chrome extension
 * This will be called when the extension is uninstalled
 */
export const registerUninstallCleanup = () => {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.setUninstallURL('https://chromarx.it.com/uninstall-feedback', () => {
      if (chrome.runtime.lastError) {
        cleanupLogger.error('Failed to set uninstall URL', chrome.runtime.lastError);
      } else {
        cleanupLogger.info('Uninstall URL set successfully');
      }
    });
    
    // Listen for extension disable/uninstall events
    chrome.runtime.onSuspend.addListener(() => {
      cleanupLogger.info('Extension being suspended, performing cleanup');
      cleanupData(['cache']).catch(error => {
        cleanupLogger.error('Error during suspension cleanup', error);
      });
    });
    
    cleanupLogger.info('Uninstall cleanup handler registered');
  }
};

/**
 * Export user data for portability requirements
 */
export const exportUserData = async (): Promise<string> => {
  try {
    const userData = {
      settings: await storage.get('settings'),
      bookmarks: await storage.get('bookmarks'),
      history: await storage.get('history'),
      exportDate: new Date().toISOString(),
      version: chrome.runtime.getManifest().version
    };
    
    return JSON.stringify(userData, null, 2);
  } catch (error) {
    cleanupLogger.error('Error exporting user data', error);
    throw new Error('Failed to export user data');
  }
};
