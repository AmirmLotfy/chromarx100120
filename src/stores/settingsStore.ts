import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { savePrivacySettings } from '@/services/privacyService';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  colorScheme: 'default' | 'purple' | 'blue' | 'green';
  highContrast: boolean;
  dataCollection: boolean;
  notifications: {
    bookmarks: boolean;
    updates: boolean;
    reminders: boolean;
  };
  experimentalFeatures: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setColorScheme: (scheme: 'default' | 'purple' | 'blue' | 'green') => void;
  setHighContrast: (enabled: boolean) => void;
  setDataCollection: (enabled: boolean, userId?: string) => void;
  setNotifications: (type: keyof SettingsState['notifications'], enabled: boolean, userId?: string) => void;
  setExperimentalFeatures: (enabled: boolean) => void;
  resetSettings: () => void;
}

const initialState = {
  theme: 'system' as const,
  colorScheme: 'default' as const,
  highContrast: false,
  dataCollection: true,
  notifications: {
    bookmarks: true,
    updates: true,
    reminders: true,
  },
  experimentalFeatures: false,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      setTheme: (theme) => {
        set({ theme });
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        if (theme !== 'system') {
          root.classList.add(theme);
        }
      },
      setColorScheme: (colorScheme) => {
        set({ colorScheme });
        const root = document.documentElement;
        root.classList.remove('theme-default', 'theme-purple', 'theme-blue', 'theme-green');
        if (colorScheme !== 'default') {
          root.classList.add(`theme-${colorScheme}`);
        }
      },
      setHighContrast: (highContrast) => set({ highContrast }),
      setDataCollection: async (dataCollection, userId) => {
        set({ dataCollection });
        if (userId) {
          const settings = { dataCollection, notifications: initialState.notifications };
          await savePrivacySettings(userId, settings);
          console.log('Data collection setting saved:', dataCollection);
        }
      },
      setNotifications: async (type, enabled, userId) => {
        set((state) => ({
          notifications: {
            ...state.notifications,
            [type]: enabled,
          },
        }));
        
        if (userId) {
          const state = useSettings.getState();
          const settings = {
            dataCollection: state.dataCollection,
            notifications: state.notifications,
          };
          await savePrivacySettings(userId, settings);
          console.log(`Notification setting ${type} saved:`, enabled);
        }
      },
      setExperimentalFeatures: (experimentalFeatures) => set({ experimentalFeatures }),
      resetSettings: () => {
        set(initialState);
        const root = document.documentElement;
        root.classList.remove('light', 'dark', 'theme-default', 'theme-purple', 'theme-blue', 'theme-green');
      },
    }),
    {
      name: 'chromarx-settings',
    }
  )
);