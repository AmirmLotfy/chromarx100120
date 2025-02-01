import { chromeDb } from '@/lib/chrome-storage';

export const storeGeminiApiKey = async (userId: string, apiKey: string) => {
  try {
    await chromeDb.set('settings', {
      geminiApiKey: apiKey,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error storing API key:', error);
    return false;
  }
};

export const getGeminiApiKey = async (userId: string) => {
  try {
    const settings = await chromeDb.get('settings');
    return settings?.geminiApiKey || null;
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
};

export const storePayPalCredentials = async (clientId: string, secretKey: string) => {
  try {
    await chromeDb.set('settings', {
      paypal: {
        clientId,
        secretKey,
        updatedAt: new Date().toISOString(),
      }
    });
    return true;
  } catch (error) {
    console.error('Error storing PayPal credentials:', error);
    return false;
  }
};

export const getPayPalClientId = async () => {
  try {
    const settings = await chromeDb.get('settings');
    return settings?.paypal?.clientId || null;
  } catch (error) {
    console.error('Error getting PayPal client ID:', error);
    return null;
  }
};