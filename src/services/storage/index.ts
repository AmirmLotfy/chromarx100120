
// Export the unified storage as the default export
export { default, storage } from './unifiedStorage';

// Export individual components for direct use when needed
export { chromeStorageProvider } from './chromeStorageProvider';
export { indexedDbProvider } from './indexedDbProvider';
export { cacheManager } from './cacheManager';

// Export type definitions
export * from './types';

// Export compatibility layer
export { chromeDb, localStorageCompat, storageService } from './compat';

// Re-export environment utilities
export { isExtensionEnvironment, isBrowserEnvironment } from '@/utils/environmentUtils';
