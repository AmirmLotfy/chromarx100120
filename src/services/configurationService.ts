
import { storage } from './storage/unifiedStorage';
import { enhancedStorage } from './enhancedStorageService';
import { toast } from 'sonner';

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'light',
  dataCollection: false,
  experimentalFeatures: false,
  autoSync: true,
  syncInterval: 30, // minutes
  maxBackgroundConcurrency: 5,
  offline: {
    enabled: true,
    syncOnConnect: true,
    savePageContent: false
  },
  bookmarks: {
    useFolderColors: true,
    showFavicons: true,
    defaultView: 'list',
    sortBy: 'dateAdded',
    sortDirection: 'desc'
  },
  performance: {
    useVirtualLists: true,
    cacheResults: true,
    prefetchEnabled: true
  }
};

/**
 * Enhanced configuration service for managing application settings
 * with improved storage and caching capabilities
 */
class ConfigurationService {
  private cache = new Map<string, any>();
  private initialized = false;
  private saveDebounceTimers: Record<string, NodeJS.Timeout> = {};
  
  /**
   * Initialize the configuration service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Ensure the enhanced storage is initialized
      await enhancedStorage.initialize();
      
      // Ensure default settings exist
      await this.ensureDefaultSettings();
      
      // Warm up the cache with commonly accessed settings
      await this.getSettings('theme');
      await this.getSettings('bookmarks');
      
      this.initialized = true;
      console.log('Configuration service initialized');
    } catch (error) {
      console.error('Failed to initialize configuration service:', error);
      toast.error('Failed to initialize settings');
    }
  }
  
  /**
   * Ensure default settings exist in storage
   */
  private async ensureDefaultSettings(): Promise<void> {
    try {
      const existingSettings = await storage.get('settings');
      if (!existingSettings) {
        await storage.set('settings', DEFAULT_SETTINGS);
      } else {
        // Merge existing settings with defaults for any missing properties
        const mergedSettings = this.mergeWithDefaults(existingSettings);
        if (JSON.stringify(existingSettings) !== JSON.stringify(mergedSettings)) {
          await storage.set('settings', mergedSettings);
        }
      }
    } catch (error) {
      console.error('Error ensuring default settings:', error);
    }
  }
  
  /**
   * Merge existing settings with defaults to ensure all properties exist
   */
  private mergeWithDefaults(existingSettings: any): any {
    const result = { ...DEFAULT_SETTINGS };
    
    // Recursive helper to merge nested objects
    const mergeObjects = (target: any, source: any) => {
      for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && key in target) {
          mergeObjects(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    };
    
    mergeObjects(result, existingSettings);
    return result;
  }
  
  /**
   * Get settings value, with support for nested paths
   * e.g. getSettings('bookmarks.sortBy') 
   */
  async getSettings<T>(path: string, defaultValue?: T): Promise<T> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Check cache first
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }
    
    try {
      // Get all settings
      const settings = await storage.get('settings') || DEFAULT_SETTINGS;
      
      // Handle nested paths (e.g., 'bookmarks.sortBy')
      if (path.includes('.')) {
        const parts = path.split('.');
        let value: any = settings;
        
        for (const part of parts) {
          if (value === undefined || value === null) {
            return defaultValue !== undefined ? defaultValue : (DEFAULT_SETTINGS as any)[parts[0]];
          }
          value = value[part];
        }
        
        // Cache result
        if (value !== undefined && value !== null) {
          this.cache.set(path, value);
          return value;
        }
        
        // Return default value for this path or from DEFAULT_SETTINGS
        return defaultValue !== undefined ? defaultValue : this.getDefaultValueFromPath(path);
      }
      
      // Top-level setting
      if (settings[path] !== undefined) {
        this.cache.set(path, settings[path]);
        return settings[path];
      }
      
      // Return default
      return defaultValue !== undefined ? defaultValue : (DEFAULT_SETTINGS as any)[path];
    } catch (error) {
      console.error(`Error getting ${path} settings:`, error);
      return defaultValue !== undefined ? defaultValue : this.getDefaultValueFromPath(path);
    }
  }
  
  /**
   * Get default value from a path string
   */
  private getDefaultValueFromPath(path: string): any {
    if (!path.includes('.')) {
      return (DEFAULT_SETTINGS as any)[path];
    }
    
    const parts = path.split('.');
    let value: any = DEFAULT_SETTINGS;
    
    for (const part of parts) {
      if (value === undefined) return undefined;
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * Save settings value, with support for nested paths
   * e.g. saveSettings('bookmarks.sortBy', 'title')
   */
  async saveSettings<T>(path: string, value: T): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Debounce saves for the same path
    if (this.saveDebounceTimers[path]) {
      clearTimeout(this.saveDebounceTimers[path]);
    }
    
    return new Promise<boolean>((resolve) => {
      this.saveDebounceTimers[path] = setTimeout(async () => {
        try {
          // Update cache immediately
          this.cache.set(path, value);
          
          // Get current settings
          const settings = await storage.get('settings') || DEFAULT_SETTINGS;
          
          // Handle nested paths
          if (path.includes('.')) {
            const parts = path.split('.');
            let current: any = settings;
            
            // Navigate to the nested object
            for (let i = 0; i < parts.length - 1; i++) {
              const part = parts[i];
              if (!current[part] || typeof current[part] !== 'object') {
                current[part] = {};
              }
              current = current[part];
            }
            
            // Set the value
            const lastPart = parts[parts.length - 1];
            current[lastPart] = value;
          } else {
            // Top-level setting
            settings[path] = value;
          }
          
          // Save updated settings
          await storage.set('settings', settings);
          
          // Notify changes
          this.notifyChanges(path, value);
          
          resolve(true);
        } catch (error) {
          console.error(`Error saving ${path} settings:`, error);
          toast.error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
          resolve(false);
        }
      }, 300); // Debounce time in ms
    });
  }
  
  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<boolean> {
    try {
      await storage.set('settings', DEFAULT_SETTINGS);
      this.cache.clear();
      
      toast.success('Settings reset to defaults');
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
      return false;
    }
  }
  
  /**
   * Clear settings cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Notify about settings changes
   */
  private notifyChanges(path: string, value: any): void {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('settings-changed', {
      detail: { path, value }
    }));
    
    // Special handling for theme changes
    if (path === 'theme') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(value);
    }
  }
  
  /**
   * Export all settings (useful for backup)
   */
  async exportSettings(): Promise<string> {
    try {
      const settings = await storage.get('settings');
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }
  
  /**
   * Import settings from JSON string
   */
  async importSettings(jsonSettings: string): Promise<boolean> {
    try {
      const settings = JSON.parse(jsonSettings);
      
      // Validate settings format
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings format');
      }
      
      // Merge with defaults to ensure all properties exist
      const mergedSettings = this.mergeWithDefaults(settings);
      
      // Save settings
      await storage.set('settings', mergedSettings);
      
      // Clear cache
      this.cache.clear();
      
      toast.success('Settings imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      toast.error(`Failed to import settings: ${error instanceof Error ? error.message : 'Invalid format'}`);
      return false;
    }
  }
}

export const configurationService = new ConfigurationService();

// Auto-initialize when imported
configurationService.initialize().catch(console.error);

export default configurationService;
