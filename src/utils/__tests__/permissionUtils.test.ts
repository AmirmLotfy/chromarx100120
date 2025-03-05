
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupChromeMocks, cleanupChromeMocks, flushPromises } from '../testUtils';
import { 
  hasPermissions, 
  requestPermissions,
  removePermissions,
  getAllPermissions
} from '../permissionUtils';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe('Permission Utilities', () => {
  let chromeMocks: ReturnType<typeof setupChromeMocks>;

  beforeEach(() => {
    chromeMocks = setupChromeMocks();
  });

  afterEach(() => {
    cleanupChromeMocks();
    vi.clearAllMocks();
  });

  it('should check if permissions are granted', async () => {
    // Test when permissions are not granted
    chromeMocks.permissions.contains.mockResolvedValueOnce(false);
    
    const result = await hasPermissions({ permissions: ['history'] });
    expect(result).toBe(false);
    expect(chromeMocks.permissions.contains).toHaveBeenCalledWith({
      permissions: ['history'],
      origins: []
    });

    // Test when permissions are granted
    chromeMocks.permissions.contains.mockResolvedValueOnce(true);
    
    const result2 = await hasPermissions({ permissions: ['history'] });
    expect(result2).toBe(true);
  });

  it('should request permissions', async () => {
    // Test successful permission request
    chromeMocks.permissions.request.mockResolvedValueOnce(true);
    
    const result = await requestPermissions({ permissions: ['history'] });
    expect(result).toBe(true);
    expect(chromeMocks.permissions.request).toHaveBeenCalledWith({
      permissions: ['history'],
      origins: []
    });

    // Test denied permission request
    chromeMocks.permissions.request.mockResolvedValueOnce(false);
    
    const result2 = await requestPermissions({ permissions: ['history'] });
    expect(result2).toBe(false);
  });

  it('should remove permissions', async () => {
    // Test successful permission removal
    chromeMocks.permissions.remove.mockResolvedValueOnce(true);
    
    const result = await removePermissions({ permissions: ['history'] });
    expect(result).toBe(true);
    expect(chromeMocks.permissions.remove).toHaveBeenCalledWith({
      permissions: ['history'],
      origins: []
    });

    // Test failed permission removal
    chromeMocks.permissions.remove.mockResolvedValueOnce(false);
    
    const result2 = await removePermissions({ permissions: ['history'] });
    expect(result2).toBe(false);
  });

  it('should get all permissions', async () => {
    const mockPermissions = {
      permissions: ['storage', 'bookmarks'],
      origins: ['https://example.com/*']
    };
    
    chromeMocks.permissions.getAll.mockResolvedValueOnce(mockPermissions);
    
    const result = await getAllPermissions();
    expect(result).toEqual(mockPermissions);
    expect(chromeMocks.permissions.getAll).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    // Simulate an error in the Chrome API
    const error = new Error('Chrome API error');
    chromeMocks.permissions.contains.mockRejectedValueOnce(error);
    
    const result = await hasPermissions({ permissions: ['history'] });
    expect(result).toBe(false);
  });

  it('should handle missing Chrome API gracefully', async () => {
    // Temporarily remove chrome.permissions to simulate non-extension environment
    const originalPermissions = chrome.permissions;
    delete (chrome as any).permissions;
    
    const hasResult = await hasPermissions({ permissions: ['history'] });
    expect(hasResult).toBe(false);
    
    const requestResult = await requestPermissions({ permissions: ['history'] });
    expect(requestResult).toBe(false);
    
    const removeResult = await removePermissions({ permissions: ['history'] });
    expect(removeResult).toBe(false);
    
    const getAllResult = await getAllPermissions();
    expect(getAllResult).toEqual({ permissions: [], origins: [] });
    
    // Restore chrome.permissions
    (chrome as any).permissions = originalPermissions;
  });
});
