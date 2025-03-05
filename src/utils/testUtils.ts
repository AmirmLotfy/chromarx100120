
/**
 * Utilities for testing Chrome extension functionality
 */
import { vi } from 'vitest';

/**
 * Mock Chrome APIs for testing
 */
export const setupChromeMocks = () => {
  // Mock Chrome Storage API
  const storageMock = {
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      getBytesInUse: vi.fn().mockResolvedValue(0),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn().mockReturnValue(false)
      }
    },
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      getBytesInUse: vi.fn().mockResolvedValue(0),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn().mockReturnValue(false)
      }
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    }
  };

  // Mock Chrome Bookmarks API
  const bookmarksMock = {
    get: vi.fn().mockResolvedValue([]),
    getTree: vi.fn().mockResolvedValue([]),
    getChildren: vi.fn().mockResolvedValue([]),
    getRecent: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    move: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue(undefined),
    removeTree: vi.fn().mockResolvedValue(undefined),
    onCreated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    },
    onRemoved: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    },
    onMoved: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    },
    onChildrenReordered: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    },
    onImportBegan: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    },
    onImportEnded: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    }
  };

  // Mock Chrome Permissions API
  const permissionsMock = {
    getAll: vi.fn().mockResolvedValue({ permissions: [], origins: [] }),
    contains: vi.fn().mockResolvedValue(false),
    request: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
    onAdded: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    },
    onRemoved: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    }
  };

  // Mock Chrome Runtime API
  const runtimeMock = {
    id: 'test-extension-id',
    getManifest: vi.fn().mockReturnValue({
      name: 'ChroMarx Test',
      version: '1.1.0',
      manifest_version: 3,
      permissions: ['storage', 'bookmarks']
    }),
    getURL: vi.fn(path => `chrome-extension://test-extension-id/${path}`),
    sendMessage: vi.fn().mockResolvedValue({}),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    },
    onInstalled: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    },
    onStartup: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    },
    onSuspend: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    },
    lastError: null,
    setUninstallURL: vi.fn(),
    getPlatformInfo: vi.fn().mockResolvedValue({ os: 'mac', arch: 'x86-64' })
  };

  // Mock Chrome Tabs API
  const tabsMock = {
    get: vi.fn().mockResolvedValue({}),
    getCurrent: vi.fn().mockResolvedValue({ id: 1, url: 'https://example.com' }),
    create: vi.fn().mockResolvedValue({}),
    query: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue(undefined),
    onCreated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    },
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    },
    onRemoved: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false)
    }
  };

  // Assemble the complete Chrome API mock
  global.chrome = {
    storage: storageMock,
    bookmarks: bookmarksMock,
    permissions: permissionsMock,
    runtime: runtimeMock,
    tabs: tabsMock,
    identity: {
      getAuthToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
      removeCachedAuthToken: vi.fn().mockResolvedValue(undefined),
      launchWebAuthFlow: vi.fn().mockResolvedValue('https://callback.com?code=123'),
      getProfileUserInfo: vi.fn().mockResolvedValue({ email: 'test@example.com', id: '123' })
    }
  } as any;

  return {
    storage: storageMock,
    bookmarks: bookmarksMock,
    permissions: permissionsMock,
    runtime: runtimeMock,
    tabs: tabsMock
  };
};

/**
 * Clean up Chrome API mocks after testing
 */
export const cleanupChromeMocks = () => {
  delete global.chrome;
};

/**
 * Helper to wait for promises to resolve in tests
 */
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));
