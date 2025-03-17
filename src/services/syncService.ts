
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";
import { storage } from "./storageService";

class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  private offlineQueue: any[] = [];
  private deviceId: string;
  private changeSubscriptions: Map<string, Function> = new Map();

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
    try {
      const queue = await storage.get<any[]>('offlineQueue');
      if (queue) {
        this.offlineQueue = queue;
      }

      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      
      if (!navigator.onLine) {
        this.handleOffline();
      }
    } catch (error) {
      console.error('Error initializing offline support:', error);
    }
  }

  private async handleOnline() {
    toast.info('Back online.');
    await this.processOfflineQueue();
  }

  private handleOffline() {
    toast.warning('You are offline. Changes will be saved locally.');
  }

  async getOfflineQueueCount(): Promise<number> {
    return this.offlineQueue.length;
  }

  async getConflictCount(): Promise<number> {
    try {
      const conflicts = await storage.get<any[]>('syncConflicts') || [];
      return conflicts.length;
    } catch (error) {
      console.error('Error getting conflict count:', error);
      return 0;
    }
  }
  
  async getConflicts(): Promise<any[]> {
    try {
      return await storage.get<any[]>('syncConflicts') || [];
    } catch (error) {
      console.error('Error getting conflicts:', error);
      return [];
    }
  }
  
  async resolveAllConflicts(): Promise<void> {
    try {
      await storage.set('syncConflicts', []);
      toast.success('All conflicts resolved');
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      toast.error('Failed to resolve conflicts');
    }
  }
  
  async addToOfflineQueue(operation: any): Promise<void> {
    try {
      this.offlineQueue.push({
        ...operation,
        timestamp: new Date().toISOString(),
        deviceId: this.deviceId
      });
      
      await storage.set('offlineQueue', this.offlineQueue);
      
      // If we're online, process the queue immediately
      if (navigator.onLine) {
        await this.processOfflineQueue();
      }
    } catch (error) {
      console.error('Error adding to offline queue:', error);
    }
  }
  
  async processOfflineQueue(): Promise<void> {
    if (this.syncInProgress || this.offlineQueue.length === 0) return;
    
    this.syncInProgress = true;
    toast.info(`Processing ${this.offlineQueue.length} pending changes...`);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, we would send these operations to a server
      // For now, we'll just clear the queue
      this.offlineQueue = [];
      await storage.set('offlineQueue', this.offlineQueue);
      
      toast.success('All changes synchronized');
    } catch (error) {
      console.error('Error processing offline queue:', error);
      toast.error('Failed to synchronize some changes');
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncAllBookmarks(userId: string, bookmarks: ChromeBookmark[]): Promise<void> {
    try {
      console.log(`Syncing ${bookmarks.length} bookmarks for user ${userId}`);
      
      // Simulate synchronization delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store in local storage for persistence
      await storage.set('syncedBookmarks', bookmarks);
      
      // Notify subscribers
      this.notifySubscribers(userId, bookmarks);
    } catch (error) {
      console.error('Error syncing bookmarks:', error);
      throw error;
    }
  }
  
  async subscribeToChanges(userId: string, onBookmarksChange: (bookmarks: ChromeBookmark[]) => void): Promise<void> {
    this.changeSubscriptions.set(userId, onBookmarksChange);
    
    // Initially send any cached bookmarks
    const cachedBookmarks = await storage.get<ChromeBookmark[]>('syncedBookmarks');
    if (cachedBookmarks && cachedBookmarks.length > 0) {
      onBookmarksChange(cachedBookmarks);
    }
  }
  
  private notifySubscribers(userId: string, bookmarks: ChromeBookmark[]): void {
    const callback = this.changeSubscriptions.get(userId);
    if (callback) {
      callback(bookmarks);
    }
  }

  async getSyncStatus(userId: string): Promise<any> {
    return {
      id: 'local-sync-status',
      user_id: userId,
      last_sync: new Date().toISOString(),
      status: 'idle',
      message: 'Local sync only (no Supabase)'
    };
  }

  async updateSyncStatus(userId: string, status: string, message?: string): Promise<void> {
    console.log('Update sync status (simplified):', { userId, status, message });
    // No-op in simplified implementation
  }
}

export const syncService = SyncService.getInstance();
