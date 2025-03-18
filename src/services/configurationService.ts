
import { storage } from './storage/unifiedStorage';

export interface PayPalConfig {
  clientId: string;
  mode: 'sandbox' | 'live';
}

export const configurationService = {
  async getPayPalConfig(): Promise<PayPalConfig> {
    try {
      const config = await storage.get('paypal_config') as PayPalConfig | null;
      
      if (!config) {
        // Return default config if none found
        return {
          clientId: '',
          mode: 'sandbox'
        };
      }
      
      return config;
    } catch (error) {
      console.error('Error getting PayPal config:', error);
      // Return default config on error
      return {
        clientId: '',
        mode: 'sandbox'
      };
    }
  },
  
  async savePayPalConfig(config: PayPalConfig): Promise<boolean> {
    try {
      await storage.set('paypal_config', config);
      return true;
    } catch (error) {
      console.error('Error saving PayPal config:', error);
      return false;
    }
  }
};
