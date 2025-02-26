
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/services/storageService";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";

interface SyncStatus {
  id: string;
  user_id: string;
  last_sync: string;
  status: 'idle' | 'syncing' | 'error' | 'success';
  message?: string;
}

export class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  private offlineQueue: any[] = [];
  private channel: any = null;

  private constructor() {
    this.initializeOfflineSupport();
  }

  static getInstance(): SyncService {
    if (!this.instance) {
      this.instance = new SyncService();
    }
    return this.instance;
  }

  private async initializeOfflineSupport() {
    // Load offline queue from storage
    const queue = await storage.get<any[]>('offlineQueue');
    if (queue) {
      this.offlineQueue = queue;
      this.processOfflineQueue();
    }

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  private async handleOnline() {
    toast.info('Back online. Syncing changes...');
    await this.processOfflineQueue();
  }

  private handleOffline() {
    toast.warning('You are offline. Changes will be synced when connection is restored.');
  }

  async subscribeToChanges(userId: string, onBookmarkChange: (bookmarks: ChromeBookmark[]) => void) {
    if (this.channel) {
      this.channel.unsubscribe();
    }

    this.channel = supabase
      .channel('bookmark-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmark_metadata',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('Received real-time update:', payload);
          await this.handleRealtimeUpdate(payload, onBookmarkChange);
        }
      )
      .subscribe();
  }

  private async handleRealtimeUpdate(payload: any, onBookmarkChange: (bookmarks: ChromeBookmark[]) => void) {
    try {
      // Get current bookmarks
      const currentBookmarks = await storage.get<ChromeBookmark[]>('bookmarks') || [];
      
      switch (payload.eventType) {
        case 'INSERT':
          currentBookmarks.push(payload.new);
          break;
        case 'UPDATE':
          const index = currentBookmarks.findIndex(b => b.id === payload.new.id);
          if (index !== -1) {
            // Check version for conflict resolution
            if (payload.new.version > currentBookmarks[index].version) {
              currentBookmarks[index] = payload.new;
            }
          }
          break;
        case 'DELETE':
          const deleteIndex = currentBookmarks.findIndex(b => b.id === payload.old.id);
          if (deleteIndex !== -1) {
            currentBookmarks.splice(deleteIndex, 1);
          }
          break;
      }

      await storage.set('bookmarks', currentBookmarks);
      onBookmarkChange(currentBookmarks);
    } catch (error) {
      console.error('Error handling realtime update:', error);
      toast.error('Error syncing changes');
    }
  }

  private async processOfflineQueue() {
    if (this.syncInProgress || !navigator.onLine || this.offlineQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    try {
      while (this.offlineQueue.length > 0) {
        const operation = this.offlineQueue[0];
        await this.executeOperation(operation);
        this.offlineQueue.shift();
        await storage.set('offlineQueue', this.offlineQueue);
      }
      toast.success('All changes synced successfully');
    } catch (error) {
      console.error('Error processing offline queue:', error);
      toast.error('Error syncing some changes');
    } finally {
      this.syncInProgress = false;
    }
  }

  private async executeOperation(operation: any) {
    try {
      const { type, data } = operation;
      switch (type) {
        case 'create':
          await supabase.from('bookmark_metadata').insert(data);
          break;
        case 'update':
          await supabase.from('bookmark_metadata')
            .update({ ...data, version: data.version + 1 })
            .eq('id', data.id)
            .lt('version', data.version + 1);
          break;
        case 'delete':
          await supabase.from('bookmark_metadata').delete().eq('id', data.id);
          break;
      }
    } catch (error) {
      console.error('Error executing operation:', error);
      throw error;
    }
  }

  async addToOfflineQueue(operation: any) {
    this.offlineQueue.push(operation);
    await storage.set('offlineQueue', this.offlineQueue);
    
    if (navigator.onLine) {
      await this.processOfflineQueue();
    }
  }

  async updateSyncStatus(userId: string, status: 'idle' | 'syncing' | 'error' | 'success', message?: string) {
    try {
      await supabase.from('sync_status').upsert({
        user_id: userId,
        status,
        message,
        last_sync: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  async getSyncStatus(userId: string): Promise<SyncStatus | null> {
    try {
      const { data, error } = await supabase
        .from('sync_status')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting sync status:', error);
      return null;
    }
  }
}

export const syncService = SyncService.getInstance();
