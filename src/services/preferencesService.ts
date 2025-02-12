
import { chromeDb } from '@/lib/chrome-storage';

export const savePrivacySettings = async (userId: string, settings: any) => {
  try {
    await chromeDb.set('settings', {
      ...settings,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving privacy settings:', error);
  }
};

export const getPrivacySettings = async (userId: string) => {
  try {
    const settings = await chromeDb.get('settings');
    return settings || null;
  } catch (error) {
    console.error('Error getting privacy settings:', error);
    return null;
  }
};
