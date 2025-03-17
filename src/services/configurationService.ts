
/**
 * Configuration Service
 * Manages API keys and configuration for external services
 */
import { chromeStorage } from './chromeStorageService';

// Default PayPal configuration
const DEFAULT_PAYPAL_CONFIG = {
  // This is a sandbox client ID, replace with your actual production client ID
  clientId: 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R',
  mode: 'sandbox' as 'sandbox' | 'live'
};

// Default Gemini API configuration
const DEFAULT_GEMINI_CONFIG = {
  // Replace with your actual Gemini API key in production
  apiKey: process.env.GEMINI_API_KEY || 'AIzaSyDaUMZ3vVjdHg89JD2-GBqCBVlWZ9WsrSU',
  temperature: 0.4,
  topK: 32,
  topP: 0.95,
  maxOutputTokens: 1024,
  maxRetries: 2
};

export const configurationService = {
  /**
   * Get PayPal configuration
   */
  async getPayPalConfig() {
    // Try to get saved config first
    const savedConfig = await chromeStorage.get('paypal_config', { encrypt: true });
    
    // Return default if no saved config
    return savedConfig || DEFAULT_PAYPAL_CONFIG;
  },
  
  /**
   * Get Gemini API configuration
   */
  async getGeminiConfig() {
    // Try to get saved config first
    const savedConfig = await chromeStorage.get('gemini_config', { encrypt: true });
    
    // Return default if no saved config
    return savedConfig || DEFAULT_GEMINI_CONFIG;
  },
  
  /**
   * Update PayPal configuration - only for development/testing
   * In production, this shouldn't be exposed to users
   */
  async updatePayPalConfig(config: typeof DEFAULT_PAYPAL_CONFIG) {
    return chromeStorage.set('paypal_config', config, { encrypt: true });
  },
  
  /**
   * Update Gemini configuration - only for development/testing
   * In production, this shouldn't be exposed to users
   */
  async updateGeminiConfig(config: typeof DEFAULT_GEMINI_CONFIG) {
    return chromeStorage.set('gemini_config', config, { encrypt: true });
  }
};
