
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
  },
  
  async getGeminiApiKey(): Promise<string> {
    try {
      const config = await storage.get('gemini_config') as {apiKey: string} | null;
      return config?.apiKey || '';
    } catch (error) {
      console.error('Error getting Gemini API key:', error);
      return '';
    }
  },
  
  async saveGeminiApiKey(apiKey: string): Promise<boolean> {
    try {
      const existingConfig = await storage.get('gemini_config') as {apiKey: string} | null || {};
      await storage.set('gemini_config', { ...existingConfig, apiKey });
      return true;
    } catch (error) {
      console.error('Error saving Gemini API key:', error);
      return false;
    }
  }
};
