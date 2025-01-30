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
      setTheme: (theme) => set({ theme }),
      setColorScheme: (colorScheme) => set({ colorScheme }),
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
      resetSettings: () => set(initialState),
    }),
    {
      name: 'chromarx-settings',
    }
  )
);