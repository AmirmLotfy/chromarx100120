
import { storage } from './storage/unifiedStorage';

// Simple configuration service that could be expanded in the future
export const configurationService = {
  // General settings
  async getSettings<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const value = await storage.get(key) as T | null;
      return value !== null ? value : defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} settings:`, error);
      return defaultValue;
    }
  },
  
  async saveSettings<T>(key: string, value: T): Promise<boolean> {
    try {
      await storage.set(key, value);
      return true;
    } catch (error) {
      console.error(`Error saving ${key} settings:`, error);
      return false;
    }
  },

  // PayPal specific methods
  async getPayPalConfig(): Promise<{ clientId: string, mode: 'sandbox' | 'live' }> {
    try {
      // Use chrome.storage.sync for sensitive configuration data with encryption
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        // Add encryption here later if needed
        const result = await chrome.storage.sync.get('paypal_config');
        const config = result.paypal_config || { clientId: '', mode: 'sandbox' };
        return config;
      } else {
        // Fallback to our unified storage
        return await this.getSettings('paypal_config', { clientId: '', mode: 'sandbox' });
      }
    } catch (error) {
      console.error('Error getting PayPal config:', error);
      return { clientId: '', mode: 'sandbox' };
    }
  },
  
  async savePayPalConfig(config: { clientId: string, mode: 'sandbox' | 'live' }): Promise<boolean> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        // Add encryption here if needed
        await chrome.storage.sync.set({ 'paypal_config': config });
        return true;
      } else {
        return await this.saveSettings('paypal_config', config);
      }
    } catch (error) {
      console.error('Error saving PayPal config:', error);
      return false;
    }
  }
};
