import { chromeDb, StorageData } from '@/lib/chrome-storage';

export const getHistory = async (userId: string) => {
  try {
    const history = await chromeDb.get<StorageData['history']>('history');
    return history || [];
  } catch (error) {
    console.error('Error fetching history:', error);
    throw new Error('Failed to fetch history');
  }
};

export const addHistoryItem = async (userId: string, item: any) => {
  try {
    const history = await getHistory(userId);
    const newHistory = [...history, item];
    await chromeDb.set('history', newHistory);
  } catch (error) {
    console.error('Error adding history item:', error);
    throw new Error('Failed to add history item');
  }
};

export const clearHistory = async (userId: string) => {
  try {
    await chromeDb.set('history', []);
  } catch (error) {
    console.error('Error clearing history:', error);
    throw new Error('Failed to clear history');
  }
};