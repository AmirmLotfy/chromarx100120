
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

  private constructor() {
    this.initializeBackgroundSync();
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
      
      for (const [key, value] of Object.entries(allData)) {
        // Ensure value is a valid JSON type
        const jsonValue = this.ensureJsonValue(value);
        await this.backupItem(key, jsonValue, user.data.user.id);
      }

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Error during sync:', error);
      toast.error('Failed to sync data to cloud');
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

  async restoreFromBackup(): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.log('No user logged in, skipping restore');
        return;
      }

      const { data, error } = await supabase
        .from('storage_backups')
        .select()
        .eq('user_id', user.data.user.id)
        .eq('storage_type', 'sync');

      if (error) throw error;
      if (!data) return;

      for (const item of data) {
        await storage.set(item.key, item.value);
      }

      toast.success('Data restored from cloud backup');
    } catch (error) {
      console.error('Error restoring from backup:', error);
      toast.error('Failed to restore from cloud backup');
    }
  }
}

export const supabaseBackup = SupabaseBackupService.getInstance();
