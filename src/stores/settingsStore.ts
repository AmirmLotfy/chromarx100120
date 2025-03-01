
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { savePrivacySettings } from '@/services/preferencesService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  affiliateBannersEnabled: boolean;
  autoDetectBookmarks: boolean;
  cloudBackupEnabled: boolean;
  syncInProgress: boolean;
  lastSynced: string | null;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setColorScheme: (scheme: 'default' | 'purple' | 'blue' | 'green') => void;
  setHighContrast: (enabled: boolean) => void;
  setDataCollection: (enabled: boolean, userId?: string) => Promise<void>;
  setNotifications: (type: keyof SettingsState['notifications'], enabled: boolean, userId?: string) => Promise<void>;
  setExperimentalFeatures: (enabled: boolean) => void;
  setAffiliateBannersEnabled: (enabled: boolean) => void;
  setAutoDetectBookmarks: (enabled: boolean) => void;
  setCloudBackupEnabled: (enabled: boolean) => Promise<void>;
  resetSettings: () => void;
  syncSettingsWithServer: (userId: string) => Promise<void>;
  fetchSettingsFromServer: (userId: string) => Promise<void>;
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
  affiliateBannersEnabled: true,
  autoDetectBookmarks: true,
  cloudBackupEnabled: false,
  syncInProgress: false,
  lastSynced: null,
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
        
        const userId = useAuth.getState()?.user?.id;
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
        
        const userId = useAuth.getState()?.user?.id;
        if (userId && get().cloudBackupEnabled) {
          get().syncSettingsWithServer(userId);
        }
      },
      setHighContrast: (highContrast) => {
        set({ highContrast });
        
        const userId = useAuth.getState()?.user?.id;
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
        set((state) => ({
          notifications: {
            ...state.notifications,
            [type]: enabled,
          },
        }));
        
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
        
        const userId = useAuth.getState()?.user?.id;
        if (userId && get().cloudBackupEnabled) {
          get().syncSettingsWithServer(userId);
        }
      },
      setAffiliateBannersEnabled: (affiliateBannersEnabled) => {
        set({ affiliateBannersEnabled });
        
        const userId = useAuth.getState()?.user?.id;
        if (userId && get().cloudBackupEnabled) {
          get().syncSettingsWithServer(userId);
        }
      },
      setAutoDetectBookmarks: (autoDetectBookmarks) => {
        set({ autoDetectBookmarks });
        
        const userId = useAuth.getState()?.user?.id;
        if (userId && get().cloudBackupEnabled) {
          get().syncSettingsWithServer(userId);
        }
      },
      setCloudBackupEnabled: async (cloudBackupEnabled) => {
        set({ cloudBackupEnabled });
        
        const userId = useAuth.getState()?.user?.id;
        if (userId) {
          if (cloudBackupEnabled) {
            await get().syncSettingsWithServer(userId);
            
            // Trigger initial backup
            import('@/services/supabaseBackupService').then(({ supabaseBackup }) => {
              supabaseBackup.syncAll().catch(console.error);
            });
          }
        } else if (cloudBackupEnabled) {
          // User not logged in but tried to enable cloud backup
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
        
        try {
          set({ syncInProgress: true });
          
          const currentSettings = get();
          const { data, error } = await supabase
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
          
        } catch (error) {
          console.error('Error syncing settings to server:', error);
          set({ syncInProgress: false });
        }
      },
      fetchSettingsFromServer: async (userId) => {
        if (!userId || get().syncInProgress) return;
        
        try {
          set({ syncInProgress: true });
          
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (error) {
            if (error.code === 'PGRST116') {
              // Record not found, create initial settings
              await get().syncSettingsWithServer(userId);
            } else {
              throw error;
            }
          }
          
          if (data) {
            // Apply server settings to local state
            const serverSettings = data.settings || {};
            
            set({
              theme: data.theme || get().theme,
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
            
            // Apply theme immediately
            const root = document.documentElement;
            root.classList.remove('light', 'dark');
            if (data.theme && data.theme !== 'system') {
              root.classList.add(data.theme);
            }
            
            // Apply color scheme
            if (serverSettings.colorScheme) {
              root.classList.remove('theme-default', 'theme-purple', 'theme-blue', 'theme-green');
              if (serverSettings.colorScheme !== 'default') {
                root.classList.add(`theme-${serverSettings.colorScheme}`);
              }
            }
          }
          
          set({ syncInProgress: false });
          
        } catch (error) {
          console.error('Error fetching settings from server:', error);
          set({ syncInProgress: false });
        }
      }
    }),
    {
      name: 'chromarx-settings',
    }
  )
);

// Initialize settings sync with server when user is authenticated
if (typeof window !== 'undefined') {
  // Setup auth state listener to sync settings when user logs in
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const userId = session.user.id;
      // First fetch settings from server
      useSettings.getState().fetchSettingsFromServer(userId);
    }
  });
  
  // Check if already logged in on page load
  const checkCurrentUser = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const userId = data.session.user.id;
      useSettings.getState().fetchSettingsFromServer(userId);
    }
  };
  
  checkCurrentUser();
}
