
import { StorageService } from '../storageService';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    // Reset storage service instance
    StorageService['instance'] = undefined;
    storageService = StorageService.getInstance();
    
    // Clear mocks
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should retrieve value from cache if available', async () => {
      const mockData = { test: 'data' };
      storageService['cache'].set('testKey', mockData);

      const result = await storageService.get('testKey');
      expect(result).toEqual(mockData);
      expect(chrome.storage.sync.get).not.toHaveBeenCalled();
    });

    it('should retrieve value from storage if not in cache', async () => {
      const mockData = { testKey: 'data' };
      (chrome.storage.sync.get as jest.Mock).mockResolvedValueOnce(mockData);

      const result = await storageService.get('testKey');
      expect(result).toBe('data');
      expect(chrome.storage.sync.get).toHaveBeenCalledWith('testKey');
    });
  });

  describe('set', () => {
    it('should set value in storage and cache', async () => {
      const value = { test: 'data' };
      await storageService.set('testKey', value);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ testKey: value });
      expect(storageService['cache'].get('testKey')).toBe(value);
    });
  });

  describe('update', () => {
    it('should update existing value', async () => {
      const initial = { name: 'test', value: 1 };
      const update = { value: 2 };
      
      (chrome.storage.sync.get as jest.Mock).mockResolvedValueOnce({ testKey: initial });

      await storageService.update('testKey', update);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        testKey: { name: 'test', value: 2 }
      });
    });
  });

  describe('remove', () => {
    it('should remove value from storage and cache', async () => {
      storageService['cache'].set('testKey', 'value');

      await storageService.remove('testKey');

      expect(chrome.storage.sync.remove).toHaveBeenCalledWith('testKey');
      expect(storageService['cache'].has('testKey')).toBe(false);
    });
  });
});
