
import { StorageService } from '../storageService';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupChromeMocks, cleanupChromeMocks } from '@/utils/testUtils';

describe('StorageService', () => {
  let storageService: StorageService;
  let chromeMocks: ReturnType<typeof setupChromeMocks>;

  beforeEach(() => {
    // Reset storage service instance and setup mocks
    chromeMocks = setupChromeMocks();
    StorageService['instance'] = undefined;
    storageService = StorageService.getInstance();
    
    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupChromeMocks();
  });

  describe('get', () => {
    it('should retrieve value from cache if available', async () => {
      const mockData = { test: 'data' };
      storageService['cache'].set('testKey', mockData);

      const result = await storageService.get('testKey');
      expect(result).toEqual(mockData);
      expect(chromeMocks.storage.sync.get).not.toHaveBeenCalled();
    });

    it('should retrieve value from storage if not in cache', async () => {
      const mockData = { testKey: 'data' };
      chromeMocks.storage.sync.get.mockResolvedValueOnce(mockData);

      const result = await storageService.get('testKey');
      expect(result).toBe('data');
      expect(chromeMocks.storage.sync.get).toHaveBeenCalledWith('testKey');
    });

    it('should return null if storage access fails', async () => {
      chromeMocks.storage.sync.get.mockRejectedValueOnce(new Error('Storage error'));

      const result = await storageService.get('testKey');
      expect(result).toBeNull();
    });

    it('should handle non-extension environment gracefully', async () => {
      // Mock localStorage for non-extension environment
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      
      // Temporarily remove chrome API to simulate non-extension environment
      const originalChrome = global.chrome;
      delete global.chrome;
      
      // Reset instance to reinitialize with new environment
      StorageService['instance'] = undefined;
      const nonExtStorageService = StorageService.getInstance();
      
      // Test localStorage fallback for get
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ test: 'value' }));
      const result = await nonExtStorageService.get('testKey');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('testKey');
      
      // Restore chrome API
      global.chrome = originalChrome;
    });
  });

  describe('set', () => {
    it('should set value in storage and cache', async () => {
      const value = { test: 'data' };
      await storageService.set('testKey', value);

      expect(chromeMocks.storage.sync.set).toHaveBeenCalledWith({ testKey: value });
      expect(storageService['cache'].get('testKey')).toBe(value);
    });

    it('should handle errors when setting values', async () => {
      chromeMocks.storage.sync.set.mockRejectedValueOnce(new Error('Storage error'));
      
      await expect(storageService.set('testKey', 'value')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update existing value', async () => {
      const initial = { name: 'test', value: 1 };
      const update = { value: 2 };
      
      chromeMocks.storage.sync.get.mockResolvedValueOnce({ testKey: initial });

      await storageService.update('testKey', update);

      expect(chromeMocks.storage.sync.set).toHaveBeenCalledWith({
        testKey: { name: 'test', value: 2 }
      });
    });

    it('should handle errors during update', async () => {
      chromeMocks.storage.sync.get.mockRejectedValueOnce(new Error('Storage error'));
      
      await expect(storageService.update('testKey', { test: 'value' })).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove value from storage and cache', async () => {
      storageService['cache'].set('testKey', 'value');

      await storageService.remove('testKey');

      expect(chromeMocks.storage.sync.remove).toHaveBeenCalledWith('testKey');
      expect(storageService['cache'].has('testKey')).toBe(false);
    });

    it('should handle errors when removing values', async () => {
      chromeMocks.storage.sync.remove.mockRejectedValueOnce(new Error('Storage error'));
      
      await expect(storageService.remove('testKey')).rejects.toThrow();
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', () => {
      storageService['cache'].set('testKey1', 'value1');
      storageService['cache'].set('testKey2', 'value2');
      
      storageService.clearCache();
      
      expect(storageService['cache'].size).toBe(0);
    });
  });
});
