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
      // First try to get from local storage
      const localConfig = await this.getSettings('paypal_config', { clientId: '', mode: 'sandbox' });
      
      // If we have a clientId, return the local config
      if (localConfig.clientId) {
        return localConfig;
      }
      
      // Otherwise, try to fetch from the Supabase function
      const response = await fetch('/api/get-paypal-config');
      if (!response.ok) {
        throw new Error('Failed to fetch PayPal configuration');
      }
      
      const config = await response.json();
      
      // Cache the config in local storage
      await this.saveSettings('paypal_config', config);
      
      return config;
    } catch (error) {
      console.error('Error getting PayPal config:', error);
      // Return a default configuration if there's an error
      return { clientId: '', mode: 'sandbox' };
    }
  },
  
  async savePayPalConfig(config: { clientId: string, mode: 'sandbox' | 'live' }): Promise<boolean> {
    return this.saveSettings('paypal_config', config);
  }
};
