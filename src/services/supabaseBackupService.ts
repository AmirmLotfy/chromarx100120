import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/services/storageService";
import { toast } from "sonner";
import { useSettings } from "@/stores/settingsStore";
import { Database } from "@/integrations/supabase/types";

type Json = Database["public"]["Tables"]["storage_backups"]["Row"]["value"];
type StorageBackup = Database["public"]["Tables"]["storage_backups"]["Row"];

class SupabaseBackupService {
  private static instance: SupabaseBackupService;
  private syncInProgress = false;
  private backupInterval: number | null = null;
  private readonly BACKUP_FREQUENCY = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  private readonly LOCAL_BACKUP_FREQUENCY = 30 * 60 * 1000; // 30 minutes in milliseconds
  private consecutiveErrors = 0;
  private maxRetries = 3;

  private constructor() {
    this.initializeBackgroundSync();
    this.initializeLocalBackups();
  }

  static getInstance(): SupabaseBackupService {
    if (!this.instance) {
      this.instance = new SupabaseBackupService();
    }
    return this.instance;
  }

  private async initializeBackgroundSync() {
    // Listen for online status changes
    window.addEventListener('online', () => {
      const settings = useSettings.getState();
      if (settings.cloudBackupEnabled) {
        this.syncAll();
      }
    });

    // Set up periodic backup scheduling
    this.schedulePeriodicBackups();
  }

  private schedulePeriodicBackups() {
    const settings = useSettings.getState();
    
    // Clear any existing interval
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
    
    // Set up new interval if enabled
    if (settings.cloudBackupEnabled && navigator.onLine) {
      this.backupInterval = window.setInterval(() => {
        console.log('Running scheduled cloud backup...');
        this.syncAll();
      }, this.BACKUP_FREQUENCY);
    }
  }

  private async initializeLocalBackups() {
    // Set up periodic local backups
    window.setInterval(async () => {
      try {
        await this.createLocalBackup();
      } catch (error) {
        console.error('Error creating local backup:', error);
      }
    }, this.LOCAL_BACKUP_FREQUENCY);
  }

  async createLocalBackup(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const allData = await chrome.storage.sync.get(null);
      
      // Store a snapshot of current data
      await chrome.storage.local.set({
        [`backup_${timestamp}`]: allData,
        'last_local_backup': timestamp
      });
      
      // Keep only the last 5 backups
      const keys = Object.keys(await chrome.storage.local.get(null))
        .filter(key => key.startsWith('backup_'))
        .sort()
        .reverse();
      
      if (keys.length > 5) {
        for (let i = 5; i < keys.length; i++) {
          await chrome.storage.local.remove(keys[i]);
        }
      }
      
      console.log('Local backup created successfully:', timestamp);
    } catch (error) {
      console.error('Error during local backup:', error);
    }
  }

  async listLocalBackups(): Promise<{timestamp: string, size: number}[]> {
    try {
      const allBackups = await chrome.storage.local.get(null);
      return Object.keys(allBackups)
        .filter(key => key.startsWith('backup_'))
        .map(key => ({
          timestamp: key.replace('backup_', ''),
          size: JSON.stringify(allBackups[key]).length
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error listing local backups:', error);
      return [];
    }
  }

  async restoreFromLocalBackup(timestamp: string): Promise<boolean> {
    try {
      const backupKey = `backup_${timestamp}`;
      const backup = await chrome.storage.local.get(backupKey);
      
      if (!backup[backupKey]) {
        toast.error('Backup not found');
        return false;
      }
      
      // Clear current data and restore from backup
      await chrome.storage.sync.clear();
      await chrome.storage.sync.set(backup[backupKey]);
      
      toast.success('Data restored from local backup');
      return true;
    } catch (error) {
      console.error('Error restoring from local backup:', error);
      toast.error('Failed to restore from local backup');
      return false;
    }
  }

  async syncAll(): Promise<void> {
    if (this.syncInProgress) return;

    try {
      this.syncInProgress = true;
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.log('No user logged in, skipping sync');
        return;
      }

      // Get all keys from chrome storage
      const allData = await chrome.storage.sync.get(null);
      const totalKeys = Object.keys(allData).length;
      let processedKeys = 0;
      
      for (const [key, value] of Object.entries(allData)) {
        try {
          // Ensure value is a valid JSON type
          const jsonValue = this.ensureJsonValue(value);
          await this.backupItem(key, jsonValue, user.data.user.id);
          
          // Update progress
          processedKeys++;
          if (processedKeys % 10 === 0 || processedKeys === totalKeys) {
            console.log(`Backup progress: ${Math.round((processedKeys / totalKeys) * 100)}%`);
          }
        } catch (error) {
          console.error(`Error backing up item ${key}:`, error);
          // Continue with other items
        }
      }

      // Update backup timestamp in settings
      const settings = useSettings.getState();
      settings.setCloudBackupEnabled(true);
      this.consecutiveErrors = 0;
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Error during sync:', error);
      this.consecutiveErrors++;
      
      const errorMessage = this.consecutiveErrors > this.maxRetries
        ? 'Multiple backup failures. Please check your connection and try again later.'
        : 'Failed to sync data to cloud';
      
      toast.error(errorMessage);
    } finally {
      this.syncInProgress = false;
    }
  }

  private ensureJsonValue(value: unknown): Json {
    if (value === null) return null;
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }
    // Convert other types to JSON-safe format
    try {
      const stringified = JSON.stringify(value);
      const parsed = JSON.parse(stringified);
      return parsed as Json;
    } catch {
      console.warn('Could not convert value to JSON:', value);
      return null;
    }
  }

  private async backupItem(key: string, value: Json, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('storage_backups')
        .upsert({
          key,
          value,
          user_id: userId,
          storage_type: 'sync',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,key'
        });

      if (error) throw error;
    } catch (error) {
      console.error(`Error backing up ${key}:`, error);
      throw error;
    }
  }

  async getBackupVersions(key: string): Promise<StorageBackup[]> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.log('No user logged in, skipping version fetch');
        return [];
      }
      
      const { data, error } = await supabase
        .from('storage_backups')
        .select()
        .eq('user_id', user.data.user.id)
        .eq('key', key)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching backup versions for ${key}:`, error);
      return [];
    }
  }

  async restoreFromBackup(timestamp?: string): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.log('No user logged in, skipping restore');
        return;
      }

      let query = supabase
        .from('storage_backups')
        .select()
        .eq('user_id', user.data.user.id)
        .eq('storage_type', 'sync');
      
      // If a specific timestamp is provided, filter by it
      if (timestamp) {
        query = query.eq('updated_at', timestamp);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('No backup found to restore from');
        return;
      }

      // Clear current storage before restoring
      await chrome.storage.sync.clear();

      for (const item of data) {
        await storage.set(item.key, item.value);
      }

      toast.success('Data restored from cloud backup');
      
      // Record this restore operation
      await chrome.storage.local.set({
        'last_restore': {
          timestamp: new Date().toISOString(),
          source: 'cloud',
          items: data.length
        }
      });
    } catch (error) {
      console.error('Error restoring from backup:', error);
      toast.error('Failed to restore from cloud backup');
    }
  }
  
  async deleteBackup(timestamp: string): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.log('No user logged in, skipping delete');
        return;
      }
      
      const { error } = await supabase
        .from('storage_backups')
        .delete()
        .eq('user_id', user.data.user.id)
        .eq('updated_at', timestamp);
        
      if (error) throw error;
      toast.success('Backup deleted successfully');
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Failed to delete backup');
    }
  }
}

export const supabaseBackup = SupabaseBackupService.getInstance();
