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

interface ConflictResolution {
  bookmarkId: string;
  resolution: 'local' | 'remote' | 'merge';
  mergedBookmark?: ChromeBookmark;
}

export class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  private offlineQueue: any[] = [];
  private channel: any = null;
  private maxRetries = 3;
  private deviceId: string;
  private conflictDetectionEnabled = true;

  private constructor() {
    this.deviceId = localStorage.getItem('device_id') || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', this.deviceId);
    
    this.initializeOfflineSupport();
  }

  static getInstance(): SyncService {
    if (!this.instance) {
      this.instance = new SyncService();
    }
    return this.instance;
  }

  private async initializeOfflineSupport() {
    const queue = await storage.get<any[]>('offlineQueue');
    if (queue) {
      this.offlineQueue = queue;
      this.processOfflineQueue();
    }

    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    if (!navigator.onLine) {
      this.handleOffline();
    }
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
            setTimeout(() => this.subscribeToChanges(userId, onBookmarkChange), 5000);
          }
        });
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      toast.error('Failed to set up real-time updates. Some changes may not appear immediately.');
      setTimeout(() => this.subscribeToChanges(userId, onBookmarkChange), 5000);
    }
  }

  private async handleRealtimeUpdate(payload: any, onBookmarkChange: (bookmarks: ChromeBookmark[]) => void) {
    await withErrorHandling(async () => {
      if (payload.new && payload.new.device_id === this.deviceId) {
        console.log('Skipping update from this device');
        return;
      }
      
      const currentBookmarks = await storage.get<ChromeBookmark[]>('bookmarks') || [];
      let updated = false;
      
      switch (payload.eventType) {
        case 'INSERT':
          const exists = currentBookmarks.some(b => b.id === payload.new.bookmark_id);
          if (!exists) {
            const newBookmark: ChromeBookmark = {
              id: payload.new.bookmark_id,
              title: payload.new.title,
              url: payload.new.url || '',
              category: payload.new.category,
              content: payload.new.content,
              version: payload.new.version || 1,
              metadata: {
                tags: payload.new.tags,
                syncStatus: 'synced',
                lastSyncedAt: new Date().toISOString()
              }
            };
            currentBookmarks.push(newBookmark);
            updated = true;
          }
          break;
          
        case 'UPDATE':
          const index = currentBookmarks.findIndex(b => b.id === payload.new.bookmark_id);
          if (index !== -1) {
            const currentVersion = currentBookmarks[index].version || 1;
            const newVersion = payload.new.version || 1;
            
            if (this.conflictDetectionEnabled && 
                currentBookmarks[index].offlineChanges && 
                newVersion !== currentVersion) {
              currentBookmarks[index] = {
                ...currentBookmarks[index],
                conflictVersion: {
                  local: currentVersion,
                  remote: newVersion,
                  resolved: false
                },
                metadata: {
                  ...currentBookmarks[index].metadata,
                  syncStatus: 'conflict'
                }
              };
              
              toast.warning(
                `Sync conflict detected for "${payload.new.title}"`, 
                { description: "Please resolve conflicts in the bookmark manager." }
              );
            } else if (newVersion >= currentVersion) {
              currentBookmarks[index] = {
                ...currentBookmarks[index],
                title: payload.new.title,
                url: payload.new.url || currentBookmarks[index].url,
                category: payload.new.category,
                content: payload.new.content,
                version: newVersion,
                metadata: {
                  ...currentBookmarks[index].metadata,
                  tags: payload.new.tags,
                  syncStatus: 'synced',
                  lastSyncedAt: new Date().toISOString()
                },
                offlineChanges: false
              };
            }
            updated = true;
          }
          break;
          
        case 'DELETE':
          const deleteIndex = currentBookmarks.findIndex(b => b.id === payload.old.bookmark_id);
          if (deleteIndex !== -1) {
            currentBookmarks.splice(deleteIndex, 1);
            updated = true;
          }
          break;
      }

      if (updated) {
        await storage.set('bookmarks', currentBookmarks);
        onBookmarkChange(currentBookmarks);
      }
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
      const totalOps = this.offlineQueue.length;
      let completedOps = 0;
      
      while (this.offlineQueue.length > 0) {
        const operation = this.offlineQueue[0];
        await this.executeOperation(operation);
        this.offlineQueue.shift();
        await storage.set('offlineQueue', this.offlineQueue);
        
        completedOps++;
        const progress = Math.round((completedOps / totalOps) * 100);
        console.log(`Sync progress: ${progress}%`);
      }
      
      toast.success('All changes synced successfully');
    } catch (error) {
      console.error('Error processing offline queue:', error);
      toast.error('Error syncing some changes. Will retry automatically when conditions improve.');
    } finally {
      this.syncInProgress = false;
    }
  }

  private async executeOperation(operation: any) {
    return retryWithBackoff(async () => {
      const { type, data } = operation;
      
      const operationData = {
        ...data,
        device_id: this.deviceId
      };
      
      switch (type) {
        case 'create':
          const { error: createError } = await supabase.from('bookmark_metadata').insert(operationData);
          if (createError) throw createError;
          break;
          
        case 'update':
          const { error: updateError } = await supabase.from('bookmark_metadata')
            .update({ 
              ...operationData, 
              version: (operationData.version || 1) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('bookmark_id', operationData.bookmark_id)
            .eq('user_id', operationData.user_id);
          if (updateError) throw updateError;
          break;
          
        case 'delete':
          const { error: deleteError } = await supabase.from('bookmark_metadata')
            .delete()
            .eq('bookmark_id', operationData.bookmark_id)
            .eq('user_id', operationData.user_id);
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
    if (operation.type !== 'delete' && (!operation.data?.user_id)) {
      console.error('Invalid operation: Missing user_id', operation);
      toast.error('Cannot sync: Invalid operation format');
      return;
    }

    if (operation.type === 'update' && operation.data.bookmark_id) {
      const bookmarks = await storage.get<ChromeBookmark[]>('bookmarks') || [];
      const bookmarkIndex = bookmarks.findIndex(b => b.id === operation.data.bookmark_id);
      
      if (bookmarkIndex !== -1) {
        bookmarks[bookmarkIndex].offlineChanges = true;
        bookmarks[bookmarkIndex].metadata = {
          ...bookmarks[bookmarkIndex].metadata,
          syncStatus: 'pending'
        };
        await storage.set('bookmarks', bookmarks);
      }
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
      const batchSize = 50;
      for (let i = 0; i < bookmarks.length; i += batchSize) {
        const batch = bookmarks.slice(i, i + batchSize);
        
        const bookmarkData = batch.map(bookmark => ({
          bookmark_id: bookmark.id,
          user_id: userId,
          url: bookmark.url || '',
          title: bookmark.title,
          category: bookmark.category,
          content: bookmark.content,
          tags: bookmark.tags,
          version: bookmark.version || 1,
          device_id: this.deviceId,
          status: 'active' as 'active' | 'archived' | 'deleted',
        }));

        const { error } = await supabase.from('bookmark_metadata').upsert(
          bookmarkData,
          { onConflict: 'bookmark_id,user_id' }
        );

        if (error) throw error;
      }

      const updatedBookmarks = bookmarks.map(bookmark => ({
        ...bookmark,
        offlineChanges: false,
        metadata: {
          ...bookmark.metadata,
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString()
        }
      }));
      
      await storage.set('bookmarks', updatedBookmarks);
      await this.updateSyncStatus(userId, 'success');
      toast.success(`Successfully synced ${bookmarks.length} bookmarks`);
    } catch (error) {
      console.error('Error syncing bookmarks:', error);
      await this.updateSyncStatus(userId, 'error', (error as Error).message);
      toast.error('Failed to sync bookmarks to cloud');
    }
  }

  async resolveConflict(userId: string, resolution: ConflictResolution) {
    try {
      const bookmarks = await storage.get<ChromeBookmark[]>('bookmarks') || [];
      const index = bookmarks.findIndex(b => b.id === resolution.bookmarkId);
      
      if (index === -1) {
        toast.error('Bookmark not found');
        return;
      }
      
      const bookmark = bookmarks[index];
      
      if (resolution.resolution === 'local') {
        bookmarks[index] = {
          ...bookmark,
          conflictVersion: undefined,
          metadata: {
            ...bookmark.metadata,
            syncStatus: 'pending'
          },
          offlineChanges: true
        };
        
        await this.addToOfflineQueue({
          type: 'update',
          data: {
            bookmark_id: bookmark.id,
            user_id: userId,
            title: bookmark.title,
            url: bookmark.url,
            category: bookmark.category,
            content: bookmark.content,
            tags: bookmark.tags,
            version: bookmark.version
          }
        });
      } else if (resolution.resolution === 'remote') {
        const { data, error } = await supabase
          .from('bookmark_metadata')
          .select('*')
          .eq('bookmark_id', bookmark.id)
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        
        bookmarks[index] = {
          ...bookmark,
          title: data.title,
          url: data.url || bookmark.url,
          category: data.category,
          content: data.content,
          tags: data.tags,
          version: data.version || bookmark.version || 1,
          conflictVersion: undefined,
          metadata: {
            ...bookmark.metadata,
            syncStatus: 'synced',
            lastSyncedAt: new Date().toISOString()
          },
          offlineChanges: false
        };
      } else if (resolution.resolution === 'merge' && resolution.mergedBookmark) {
        bookmarks[index] = {
          ...resolution.mergedBookmark,
          version: (bookmark.version || 1) + 1,
          conflictVersion: undefined,
          metadata: {
            ...bookmark.metadata,
            syncStatus: 'pending'
          },
          offlineChanges: true
        };
        
        await this.addToOfflineQueue({
          type: 'update',
          data: {
            bookmark_id: resolution.mergedBookmark.id,
            user_id: userId,
            ...resolution.mergedBookmark
          }
        });
      }
      
      await storage.set('bookmarks', bookmarks);
      toast.success('Conflict resolved successfully');
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast.error('Failed to resolve conflict');
    }
  }
}

export const syncService = SyncService.getInstance();
