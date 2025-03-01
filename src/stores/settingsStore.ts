import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { savePrivacySettings } from '@/services/preferencesService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { withErrorHandling } from '@/utils/errorUtils';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  colorScheme: 'default' | 'purple' | 'blue' | 'green';
  highContrast: boolean;
  dataCollection: boolean;
  notifications: {
    bookmarks: boolean;
    updates: boolean;
    reminders: boolean;
    email: boolean;
    push: boolean;
    desktop: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  experimentalFeatures: boolean;
  affiliateBannersEnabled: boolean;
  autoDetectBookmarks: boolean;
  cloudBackupEnabled: boolean;
  syncInProgress: boolean;
  lastSynced: string | null;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setColorScheme: (scheme: 'default' | 'purple' | 'blue' | 'green') => void;
  setHighContrast: (enabled: boolean) => void;
  setDataCollection: (enabled: boolean, userId?: string) => Promise<void>;
  setNotifications: (type: keyof SettingsState['notifications'], enabled: boolean | 'immediate' | 'daily' | 'weekly', userId?: string) => Promise<void>;
  setExperimentalFeatures: (enabled: boolean) => void;
  setAffiliateBannersEnabled: (enabled: boolean) => void;
  setAutoDetectBookmarks: (enabled: boolean) => void;
  setCloudBackupEnabled: (enabled: boolean) => Promise<void>;
  resetSettings: () => void;
  syncSettingsWithServer: (userId: string) => Promise<void>;
  fetchSettingsFromServer: (userId: string) => Promise<void>;
}

interface UserSettingsData {
  colorScheme?: 'default' | 'purple' | 'blue' | 'green';
  highContrast?: boolean;
  notifications?: {
    bookmarks: boolean;
    updates: boolean;
    reminders: boolean;
    email: boolean;
    push: boolean;
    desktop: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  experimentalFeatures?: boolean;
  affiliateBannersEnabled?: boolean;
  autoDetectBookmarks?: boolean;
  cloudBackupEnabled?: boolean;
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
    email: false,
    push: true,
    desktop: true,
    frequency: 'immediate' as const,
  },
  experimentalFeatures: false,
  affiliateBannersEnabled: true,
  autoDetectBookmarks: true,
  cloudBackupEnabled: false,
  syncInProgress: false,
  lastSynced: null,
};

const getCurrentUserId = (): string | undefined => {
  const authContext = useAuth();
  return authContext?.user?.id;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setTheme: (theme) => {
        set({ theme });
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        if (theme !== 'system') {
          root.classList.add(theme);
        }
        
        const userId = getCurrentUserId();
        if (userId && get().cloudBackupEnabled) {
          get().syncSettingsWithServer(userId);
        }
      },
      setColorScheme: (colorScheme) => {
        set({ colorScheme });
        const root = document.documentElement;
        root.classList.remove('theme-default', 'theme-purple', 'theme-blue', 'theme-green');
        if (colorScheme !== 'default') {
          root.classList.add(`theme-${colorScheme}`);
        }
        
        const userId = getCurrentUserId();
        if (userId && get().cloudBackupEnabled) {
          get().syncSettingsWithServer(userId);
        }
      },
      setHighContrast: (highContrast) => {
        set({ highContrast });
        
        const userId = getCurrentUserId();
        if (userId && get().cloudBackupEnabled) {
          get().syncSettingsWithServer(userId);
        }
      },
      setDataCollection: async (dataCollection, userId) => {
        set({ dataCollection });
        if (userId) {
          const settings = { dataCollection, notifications: get().notifications };
          await savePrivacySettings(userId, settings);
          
          if (get().cloudBackupEnabled) {
            await get().syncSettingsWithServer(userId);
          }
        }
      },
      setNotifications: async (type, enabled, userId) => {
        if (type === 'frequency' && typeof enabled === 'string') {
          const frequencyValue = enabled as 'immediate' | 'daily' | 'weekly';
          set((state) => ({
            notifications: {
              ...state.notifications,
              frequency: frequencyValue,
            },
          }));
        } else if (typeof enabled === 'boolean') {
          set((state) => ({
            notifications: {
              ...state.notifications,
              [type]: enabled,
            },
          }));
        }
        
        if (userId) {
          const state = get();
          const settings = {
            dataCollection: state.dataCollection,
            notifications: state.notifications,
          };
          await savePrivacySettings(userId, settings);
          
          if (state.cloudBackupEnabled) {
            await get().syncSettingsWithServer(userId);
          }
        }
      },
      setExperimentalFeatures: (experimentalFeatures) => {
        set({ experimentalFeatures });
        
        const userId = getCurrentUserId();
        if (userId && get().cloudBackupEnabled) {
          get().syncSettingsWithServer(userId);
        }
      },
      setAffiliateBannersEnabled: (affiliateBannersEnabled) => {
        set({ affiliateBannersEnabled });
        
        const userId = getCurrentUserId();
        if (userId && get().cloudBackupEnabled) {
          get().syncSettingsWithServer(userId);
        }
      },
      setAutoDetectBookmarks: (autoDetectBookmarks) => {
        set({ autoDetectBookmarks });
        
        const userId = getCurrentUserId();
        if (userId && get().cloudBackupEnabled) {
          get().syncSettingsWithServer(userId);
        }
      },
      setCloudBackupEnabled: async (cloudBackupEnabled) => {
        set({ cloudBackupEnabled });
        
        const userId = getCurrentUserId();
        if (userId) {
          if (cloudBackupEnabled) {
            await get().syncSettingsWithServer(userId);
            
            import('@/services/supabaseBackupService').then(({ supabaseBackup }) => {
              supabaseBackup.syncAll().catch(console.error);
            });
          }
        } else if (cloudBackupEnabled) {
          toast.error('You must be logged in to enable cloud backup');
          set({ cloudBackupEnabled: false });
        }
      },
      resetSettings: () => {
        set(initialState);
        const root = document.documentElement;
        root.classList.remove('light', 'dark', 'theme-default', 'theme-purple', 'theme-blue', 'theme-green');
      },
      syncSettingsWithServer: async (userId) => {
        if (!userId || get().syncInProgress) return;
        
        await withErrorHandling(async () => {
          set({ syncInProgress: true });
          
          const currentSettings = get();
          const { error } = await supabase
            .from('user_settings')
            .upsert({
              user_id: userId,
              theme: currentSettings.theme,
              data_collection_enabled: currentSettings.dataCollection,
              notifications_enabled: currentSettings.notifications.updates,
              settings: {
                colorScheme: currentSettings.colorScheme,
                highContrast: currentSettings.highContrast,
                notifications: currentSettings.notifications,
                experimentalFeatures: currentSettings.experimentalFeatures,
                affiliateBannersEnabled: currentSettings.affiliateBannersEnabled,
                autoDetectBookmarks: currentSettings.autoDetectBookmarks,
                cloudBackupEnabled: currentSettings.cloudBackupEnabled
              }
            }, {
              onConflict: 'user_id'
            });
          
          if (error) throw error;
          
          set({ 
            lastSynced: new Date().toISOString(),
            syncInProgress: false
          });
        }, {
          errorMessage: "Failed to sync settings to server",
          showError: true
        });

        if (get().syncInProgress) {
          set({ syncInProgress: false });
        }
      },
      fetchSettingsFromServer: async (userId) => {
        if (!userId || get().syncInProgress) return;
        
        await withErrorHandling(async () => {
          set({ syncInProgress: true });
          
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (error) {
            throw error;
          }
          
          if (data) {
            const serverSettings = data.settings as UserSettingsData || {};
            
            set({
              theme: (data.theme as 'light' | 'dark' | 'system') || get().theme,
              dataCollection: data.data_collection_enabled !== null ? data.data_collection_enabled : get().dataCollection,
              colorScheme: serverSettings.colorScheme || get().colorScheme,
              highContrast: serverSettings.highContrast !== undefined ? serverSettings.highContrast : get().highContrast,
              notifications: serverSettings.notifications || get().notifications,
              experimentalFeatures: serverSettings.experimentalFeatures !== undefined ? serverSettings.experimentalFeatures : get().experimentalFeatures,
              affiliateBannersEnabled: serverSettings.affiliateBannersEnabled !== undefined ? serverSettings.affiliateBannersEnabled : get().affiliateBannersEnabled,
              autoDetectBookmarks: serverSettings.autoDetectBookmarks !== undefined ? serverSettings.autoDetectBookmarks : get().autoDetectBookmarks,
              cloudBackupEnabled: serverSettings.cloudBackupEnabled !== undefined ? serverSettings.cloudBackupEnabled : get().cloudBackupEnabled,
              lastSynced: new Date().toISOString(),
            });
            
            const root = document.documentElement;
            root.classList.remove('light', 'dark');
            if (data.theme && data.theme !== 'system') {
              root.classList.add(data.theme);
            }
            
            if (serverSettings.colorScheme) {
              root.classList.remove('theme-default', 'theme-purple', 'theme-blue', 'theme-green');
              if (serverSettings.colorScheme !== 'default') {
                root.classList.add(`theme-${serverSettings.colorScheme}`);
              }
            }
          } else {
            await get().syncSettingsWithServer(userId);
          }
          
          set({ syncInProgress: false });
        }, {
          errorMessage: "Failed to fetch settings from server",
          showError: true
        });

        if (get().syncInProgress) {
          set({ syncInProgress: false });
        }
      }
    }),
    {
      name: 'chromarx-settings',
    }
  )
);

if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const userId = session.user.id;
      useSettings.getState().fetchSettingsFromServer(userId);
    }
  });
  
  const checkCurrentUser = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const userId = data.session.user.id;
      useSettings.getState().fetchSettingsFromServer(userId);
    }
  };
  
  checkCurrentUser();
}
