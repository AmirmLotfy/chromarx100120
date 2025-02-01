import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  setDataCollection: (enabled: boolean) => void;
  setNotifications: (type: keyof SettingsState['notifications'], enabled: boolean) => void;
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
        // Apply theme immediately
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        if (theme !== 'system') {
          root.classList.add(theme);
        }
      },
      setColorScheme: (colorScheme) => {
        set({ colorScheme });
        // Apply color scheme immediately
        const root = document.documentElement;
        root.classList.remove('theme-default', 'theme-purple', 'theme-blue', 'theme-green');
        if (colorScheme !== 'default') {
          root.classList.add(`theme-${colorScheme}`);
        }
      },
      setHighContrast: (highContrast) => set({ highContrast }),
      setDataCollection: (dataCollection) => set({ dataCollection }),
      setNotifications: (type, enabled) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [type]: enabled,
          },
        })),
      setExperimentalFeatures: (experimentalFeatures) => set({ experimentalFeatures }),
      resetSettings: () => {
        set(initialState);
        // Reset theme and color scheme classes
        const root = document.documentElement;
        root.classList.remove('light', 'dark', 'theme-default', 'theme-purple', 'theme-blue', 'theme-green');
      },
    }),
    {
      name: 'chromarx-settings',
    }
  )
);