
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";
import { storage } from "./storageService";

class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;
  private offlineQueue: any[] = [];
  private deviceId: string;

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
  }

  private handleOffline() {
    toast.warning('You are offline. Changes will be saved locally.');
  }

  async getOfflineQueueCount(): Promise<number> {
    return this.offlineQueue.length;
  }

  async getConflictCount(): Promise<number> {
    return 0; // Simplified implementation
  }
  
  async processOfflineQueue(): Promise<void> {
    console.log('Processing offline queue (simplified implementation)');
    // Clear the queue in the simplified implementation
    this.offlineQueue = [];
    await storage.set('offlineQueue', this.offlineQueue);
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
