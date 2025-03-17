
import { chromeStorage } from './chromeStorageService';

export interface PayPalConfig {
  clientId: string;
  mode: 'sandbox' | 'live';
}

export const configurationService = {
  async getPayPalConfig(): Promise<PayPalConfig> {
    try {
      const config = await chromeStorage.get<PayPalConfig>('paypal_config');
      
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
      return await chromeStorage.set('paypal_config', config);
    } catch (error) {
      console.error('Error saving PayPal config:', error);
      return false;
    }
  },
  
  async getGeminiApiKey(): Promise<string> {
    try {
      const config = await chromeStorage.get<{apiKey: string}>('gemini_config');
      return config?.apiKey || '';
    } catch (error) {
      console.error('Error getting Gemini API key:', error);
      return '';
    }
  },
  
  async saveGeminiApiKey(apiKey: string): Promise<boolean> {
    try {
      return await chromeStorage.set('gemini_config', { apiKey });
    } catch (error) {
      console.error('Error saving Gemini API key:', error);
      return false;
    }
  }
};
