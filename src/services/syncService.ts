
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/services/storageService";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";
import { retryWithBackoff } from "@/utils/retryUtils";
import { withErrorHandling } from "@/utils/errorUtils";

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
  private maxRetries = 3;

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
    try {
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
        .subscribe((status: any) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to real-time changes');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to real-time changes');
            // Try to resubscribe after a delay
            setTimeout(() => this.subscribeToChanges(userId, onBookmarkChange), 5000);
          }
        });
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      toast.error('Failed to set up real-time updates. Some changes may not appear immediately.');
      // Try to resubscribe after a delay
      setTimeout(() => this.subscribeToChanges(userId, onBookmarkChange), 5000);
    }
  }

  private async handleRealtimeUpdate(payload: any, onBookmarkChange: (bookmarks: ChromeBookmark[]) => void) {
    await withErrorHandling(async () => {
      // Get current bookmarks
      const currentBookmarks = await storage.get<ChromeBookmark[]>('bookmarks') || [];
      
      switch (payload.eventType) {
        case 'INSERT':
          currentBookmarks.push({
            ...payload.new,
            version: payload.new.version || 1
          });
          break;
        case 'UPDATE':
          const index = currentBookmarks.findIndex(b => b.id === payload.new.id);
          if (index !== -1) {
            // Check version for conflict resolution
            const currentVersion = currentBookmarks[index].version || 1;
            const newVersion = payload.new.version || 1;
            if (newVersion > currentVersion) {
              currentBookmarks[index] = {
                ...payload.new,
                version: newVersion
              };
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
    }, {
      errorMessage: "Error handling realtime update",
      showError: true
    });
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
    return retryWithBackoff(async () => {
      const { type, data } = operation;
      
      switch (type) {
        case 'create':
          const { error: createError } = await supabase.from('bookmark_metadata').insert(data);
          if (createError) throw createError;
          break;
          
        case 'update':
          const { error: updateError } = await supabase.from('bookmark_metadata')
            .update({ 
              ...data, 
              version: (data.version || 1) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.id)
            .eq('user_id', data.user_id) // Ensure we only update the user's own bookmarks
            .lt('version', (data.version || 1) + 1);
          if (updateError) throw updateError;
          break;
          
        case 'delete':
          const { error: deleteError } = await supabase.from('bookmark_metadata')
            .delete()
            .eq('id', data.id)
            .eq('user_id', data.user_id); // Ensure we only delete the user's own bookmarks
          if (deleteError) throw deleteError;
          break;
      }
    }, {
      maxRetries: this.maxRetries,
      initialDelay: 1000,
      maxDelay: 10000,
      onRetry: (error, attempt) => {
        console.warn(`Retry attempt ${attempt}/${this.maxRetries} for operation:`, operation, error);
      }
    });
  }

  async addToOfflineQueue(operation: any) {
    // Validate the operation has proper user_id to prevent security issues
    if (operation.type !== 'delete' && (!operation.data?.user_id)) {
      console.error('Invalid operation: Missing user_id', operation);
      toast.error('Cannot sync: Invalid operation format');
      return;
    }

    this.offlineQueue.push(operation);
    await storage.set('offlineQueue', this.offlineQueue);
    
    if (navigator.onLine) {
      await this.processOfflineQueue();
    }
  }

  async updateSyncStatus(userId: string, status: 'idle' | 'syncing' | 'error' | 'success', message?: string) {
    try {
      await retryWithBackoff(async () => {
        const { error } = await supabase.from('sync_status').upsert({
          user_id: userId,
          status,
          message,
          last_sync: new Date().toISOString()
        });
        
        if (error) throw error;
      });
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  async getSyncStatus(userId: string): Promise<SyncStatus | null> {
    try {
      return await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('sync_status')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        
        // Convert the status string to our enum type
        const status = data?.status as 'idle' | 'syncing' | 'error' | 'success';
        
        if (!status || !['idle', 'syncing', 'error', 'success'].includes(status)) {
          return null;
        }

        return {
          id: data.id,
          user_id: data.user_id,
          last_sync: data.last_sync,
          status,
          message: data.message
        };
      });
    } catch (error) {
      console.error('Error getting sync status:', error);
      return null;
    }
  }

  async syncAllBookmarks(userId: string, bookmarks: ChromeBookmark[]) {
    if (!userId || !bookmarks.length) {
      console.warn('Cannot sync: Missing user ID or bookmarks');
      return;
    }

    await this.updateSyncStatus(userId, 'syncing');

    try {
      // Process in batches to avoid overwhelming the server
      const batchSize = 50;
      for (let i = 0; i < bookmarks.length; i += batchSize) {
        const batch = bookmarks.slice(i, i + batchSize);
        
        // Map Chrome bookmarks to Supabase format
        const bookmarkData = batch.map(bookmark => ({
          bookmark_id: bookmark.id,
          user_id: userId,
          url: bookmark.url || '',
          title: bookmark.title,
          category: bookmark.category,
          content: bookmark.content,
          version: bookmark.version || 1,
          status: 'active',
        }));

        // Use upsert to handle both creates and updates
        const { error } = await supabase.from('bookmark_metadata').upsert(
          bookmarkData,
          { onConflict: 'bookmark_id,user_id' }
        );

        if (error) throw error;
      }

      await this.updateSyncStatus(userId, 'success');
      toast.success(`Successfully synced ${bookmarks.length} bookmarks`);
    } catch (error) {
      console.error('Error syncing bookmarks:', error);
      await this.updateSyncStatus(userId, 'error', (error as Error).message);
      toast.error('Failed to sync bookmarks to cloud');
    }
  }
}

export const syncService = SyncService.getInstance();
