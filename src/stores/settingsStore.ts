
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  autoSave: boolean;
  compactView: boolean;
  historyRetention: boolean;
  localStorageEncryption: boolean;
  historyItems: number;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  setNotifications: (enabled: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setCompactView: (enabled: boolean) => void;
  setHistoryRetention: (enabled: boolean) => void;
  setLocalStorageEncryption: (enabled: boolean) => void;
  setHistoryItems: (count: number) => void;
  reset: () => void;
}

const defaultSettings: Omit<SettingsState, 'setTheme' | 'setLanguage' | 'setNotifications' | 'setAutoSave' | 'setCompactView' | 'setHistoryRetention' | 'setLocalStorageEncryption' | 'setHistoryItems' | 'reset'> = {
  theme: 'system',
  language: 'en',
  notifications: true,
  autoSave: true,
  compactView: false,
  historyRetention: true,
  localStorageEncryption: false,
  historyItems: 0
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setNotifications: (notifications) => set({ notifications }),
      setAutoSave: (autoSave) => set({ autoSave }),
      setCompactView: (compactView) => set({ compactView }),
      setHistoryRetention: (historyRetention) => set({ historyRetention }),
      setLocalStorageEncryption: (localStorageEncryption) => set({ localStorageEncryption }),
      setHistoryItems: (historyItems) => set({ historyItems }),
      reset: () => set(defaultSettings)
    }),
    {
      name: 'settings-storage'
    }
  )
);
