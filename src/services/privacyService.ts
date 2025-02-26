import { chromeDb, StorageData } from '@/lib/chrome-storage';
import { toast } from 'sonner';

export const savePrivacySettings = async (userId: string, settings: any) => {
  try {
    await chromeDb.set('privacySettings', {
      userId,
      ...settings,
      updatedAt: new Date().toISOString(),
    });
    toast.success('Privacy settings saved successfully');
  } catch (error) {
    console.error('Error saving privacy settings:', error);
    toast.error('Failed to save privacy settings');
  }
};

export const getPrivacySettings = async (userId: string) => {
  try {
    const settings = await chromeDb.get<StorageData['privacySettings']>('privacySettings');
    return settings?.userId === userId ? settings : null;
  } catch (error) {
    console.error('Error getting privacy settings:', error);
    return null;
  }
};