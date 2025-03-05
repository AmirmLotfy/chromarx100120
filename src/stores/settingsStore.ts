
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
  // Base settings
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    bookmarks: boolean;
    updates: boolean;
    reminders: boolean;
    sounds: boolean;
    suggestions: boolean;
  };
  autoSave: boolean;
  compactView: boolean;
  historyRetention: boolean;
  localStorageEncryption: boolean;
  historyItems: number;
  
  // UI settings
  colorScheme: 'default' | 'purple' | 'blue' | 'green';
  highContrast: boolean;
  
  // Privacy settings
  dataCollection: boolean;
  experimentalFeatures: boolean;
  affiliateBannersEnabled: boolean;
  autoDetectBookmarks: boolean;
  cloudBackupEnabled: boolean;
  lastSynced: string | null;
  syncInProgress: boolean;
  
  // Action setters
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  setNotifications: (type: keyof SettingsState['notifications'], enabled: boolean, userId?: string | null) => void;
  setAutoSave: (enabled: boolean) => void;
  setCompactView: (enabled: boolean) => void;
  setHistoryRetention: (enabled: boolean) => void;
  setLocalStorageEncryption: (enabled: boolean) => void;
  setHistoryItems: (count: number) => void;
  
  // UI setters
  setColorScheme: (scheme: 'default' | 'purple' | 'blue' | 'green') => void;
  setHighContrast: (enabled: boolean) => void;
  
  // Privacy setters
  setDataCollection: (enabled: boolean, userId?: string | null) => Promise<void>;
  setExperimentalFeatures: (enabled: boolean) => void;
  setAffiliateBannersEnabled: (enabled: boolean) => void;
  setAutoDetectBookmarks: (enabled: boolean) => void;
  setCloudBackupEnabled: (enabled: boolean) => Promise<void>;
  
  // Server sync functions
  syncSettingsWithServer: (userId: string) => Promise<void>;
  fetchSettingsFromServer: (userId: string) => Promise<void>;
  
  // Reset function
  reset: () => void;
  resetSettings: () => void; // Alias for reset for backward compatibility
}

// Default settings to use when initializing or resetting
const defaultSettings: Omit<SettingsState, 
  | 'setTheme' | 'setLanguage' | 'setNotifications' | 'setAutoSave' 
  | 'setCompactView' | 'setHistoryRetention' | 'setLocalStorageEncryption' 
  | 'setHistoryItems' | 'setColorScheme' | 'setHighContrast' | 'setDataCollection'
  | 'setExperimentalFeatures' | 'setAffiliateBannersEnabled' | 'setAutoDetectBookmarks'
  | 'setCloudBackupEnabled' | 'syncSettingsWithServer' | 'fetchSettingsFromServer'
  | 'reset' | 'resetSettings'> = {
  theme: 'system',
  language: 'en',
  notifications: {
    bookmarks: true,
    updates: true,
    reminders: true,
    sounds: true,
    suggestions: true
  },
  autoSave: true,
  compactView: false,
  historyRetention: true,
  localStorageEncryption: false,
  historyItems: 0,
  colorScheme: 'default',
  highContrast: false,
  dataCollection: false,
  experimentalFeatures: false,
  affiliateBannersEnabled: true,
  autoDetectBookmarks: true,
  cloudBackupEnabled: false,
  lastSynced: null,
  syncInProgress: false
};

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      
      // Base setting setters
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setNotifications: (type, enabled, userId) => {
        const notifications = { ...get().notifications, [type]: enabled };
        set({ notifications });
        // Here would be server sync if needed with userId
      },
      setAutoSave: (autoSave) => set({ autoSave }),
      setCompactView: (compactView) => set({ compactView }),
      setHistoryRetention: (historyRetention) => set({ historyRetention }),
      setLocalStorageEncryption: (localStorageEncryption) => set({ localStorageEncryption }),
      setHistoryItems: (historyItems) => set({ historyItems }),
      
      // UI setting setters
      setColorScheme: (colorScheme) => set({ colorScheme }),
      setHighContrast: (highContrast) => set({ highContrast }),
      
      // Privacy setting setters
      setDataCollection: async (dataCollection, userId) => {
        set({ dataCollection });
        // Here would be server sync if needed with userId
      },
      setExperimentalFeatures: (experimentalFeatures) => set({ experimentalFeatures }),
      setAffiliateBannersEnabled: (affiliateBannersEnabled) => set({ affiliateBannersEnabled }),
      setAutoDetectBookmarks: (autoDetectBookmarks) => set({ autoDetectBookmarks }),
      setCloudBackupEnabled: async (cloudBackupEnabled) => {
        set({ cloudBackupEnabled });
        if (cloudBackupEnabled) {
          set({ lastSynced: new Date().toISOString() });
        }
      },
      
      // Server sync functions
      syncSettingsWithServer: async (userId) => {
        set({ syncInProgress: true });
        try {
          // Mock API call - replace with actual implementation
          await new Promise(resolve => setTimeout(resolve, 500));
          set({ lastSynced: new Date().toISOString() });
        } finally {
          set({ syncInProgress: false });
        }
      },
      fetchSettingsFromServer: async (userId) => {
        set({ syncInProgress: true });
        try {
          // Mock API call - replace with actual implementation
          await new Promise(resolve => setTimeout(resolve, 500));
          // Would normally update settings from server here
          set({ lastSynced: new Date().toISOString() });
        } finally {
          set({ syncInProgress: false });
        }
      },
      
      // Reset functions
      reset: () => set(defaultSettings),
      resetSettings: () => set(defaultSettings) // Alias for backward compatibility
    }),
    {
      name: 'settings-storage'
    }
  )
);
