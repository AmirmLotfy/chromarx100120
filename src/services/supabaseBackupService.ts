import { useState, useEffect, useCallback } from 'react';
import { storage } from "@/services/storageService";
import { toast } from "sonner";
import { useSettings } from "@/stores/settingsStore";
import { Json } from "@/lib/local-storage-client";

interface StorageBackup {
  id: string;
  key: string;
  value: Json;
  user_id: string;
  storage_type: string;
  created_at: string;
  updated_at: string;
}

class LocalBackupService {
  private static instance: LocalBackupService;
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

  static getInstance(): LocalBackupService {
    if (!this.instance) {
      this.instance = new LocalBackupService();
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
      // Get all data from storage
      const allData = {};
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            allData[key] = JSON.parse(value);
          }
        } catch (e) {
          // Skip items that can't be parsed as JSON
        }
      }
      
      // Store a snapshot of current data
      localStorage.setItem(`backup_${timestamp}`, JSON.stringify(allData));
      localStorage.setItem('last_local_backup', timestamp);
      
      // Keep only the last 5 backups
      const backupKeys = keys.filter(key => key.startsWith('backup_'))
        .sort()
        .reverse();
      
      if (backupKeys.length > 5) {
        for (let i = 5; i < backupKeys.length; i++) {
          localStorage.removeItem(backupKeys[i]);
        }
      }
      
      console.log('Local backup created successfully:', timestamp);
    } catch (error) {
      console.error('Error during local backup:', error);
    }
  }

  async listLocalBackups(): Promise<{timestamp: string, size: number}[]> {
    try {
      const allKeys = Object.keys(localStorage);
      return allKeys.filter(key => key.startsWith('backup_'))
        .map(key => {
          const value = localStorage.getItem(key) || '{}';
          return {
            timestamp: key.replace('backup_', ''),
            size: value.length
          };
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error listing local backups:', error);
      return [];
    }
  }

  async restoreFromLocalBackup(timestamp: string): Promise<boolean> {
    try {
      const backupKey = `backup_${timestamp}`;
      const backup = localStorage.getItem(backupKey);
      
      if (!backup) {
        toast.error('Backup not found');
        return false;
      }
      
      // Clear current data and restore from backup
      const backupData = JSON.parse(backup);
      
      // Remove all items except the backups themselves
      const keys = Object.keys(localStorage).filter(key => !key.startsWith('backup_') && key !== 'last_local_backup');
      keys.forEach(key => localStorage.removeItem(key));
      
      // Restore from backup
      Object.entries(backupData).forEach(([key, value]) => {
        if (!key.startsWith('backup_') && key !== 'last_local_backup') {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });
      
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
      const userId = 'local-user-id';
      
      // Get all localStorage items
      const allData = {};
      const keys = Object.keys(localStorage);
      let processedKeys = 0;
      const totalKeys = keys.length;
      
      for (const key of keys) {
        try {
          if (!key.startsWith('backup_') && key !== 'last_local_backup') {
            const value = localStorage.getItem(key);
            if (value) {
              allData[key] = this.ensureJsonValue(JSON.parse(value));
              await this.backupItem(key, allData[key], userId);
            }
          }
          
          // Update progress
          processedKeys++;
          if (processedKeys % 10 === 0 || processedKeys === totalKeys) {
            console.log(`Backup progress: ${Math.round((processedKeys / totalKeys) * 100)}%`);
          }
        } catch (e) {
          console.error(`Error backing up item ${key}:`, e);
        }
      }

      // Update backup timestamp in settings
      const settings = useSettings.getState();
      settings.setCloudBackupEnabled(true);
      this.consecutiveErrors = 0;
      
      console.log('Sync completed successfully');
      toast.success('Backup completed successfully');
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
      // Instead of Supabase, store in localStorage with a prefix
      const backupKey = `cloud_backup_${key}`;
      const backup = {
        key,
        value,
        user_id: userId,
        storage_type: 'sync',
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem(backupKey, JSON.stringify(backup));
    } catch (error) {
      console.error(`Error backing up ${key}:`, error);
      throw error;
    }
  }

  async getBackupVersions(key: string): Promise<StorageBackup[]> {
    try {
      const userId = 'local-user-id';
      const backupKey = `cloud_backup_${key}`;
      const backup = localStorage.getItem(backupKey);
      
      if (!backup) return [];
      
      const backupData = JSON.parse(backup);
      return [{
        id: `id-${Date.now()}`,
        ...backupData,
        created_at: backupData.updated_at
      }];
    } catch (error) {
      console.error(`Error fetching backup versions for ${key}:`, error);
      return [];
    }
  }

  async restoreFromBackup(timestamp?: string): Promise<void> {
    try {
      const userId = 'local-user-id';
      const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('cloud_backup_'));
      
      if (backupKeys.length === 0) {
        toast.error('No backup found to restore from');
        return;
      }
      
      // Filter by timestamp if provided
      let backupsToRestore = backupKeys;
      if (timestamp) {
        backupsToRestore = backupKeys.filter(key => {
          const backup = localStorage.getItem(key);
          if (backup) {
            const backupData = JSON.parse(backup);
            return backupData.updated_at === timestamp;
          }
          return false;
        });
      }
      
      if (backupsToRestore.length === 0) {
        toast.error('No backup found for the specified timestamp');
        return;
      }
      
      // Clear current data before restoring
      const keys = Object.keys(localStorage).filter(key => 
        !key.startsWith('backup_') && 
        !key.startsWith('cloud_backup_') && 
        key !== 'last_local_backup'
      );
      keys.forEach(key => localStorage.removeItem(key));
      
      // Restore from backup
      for (const backupKey of backupsToRestore) {
        const backup = localStorage.getItem(backupKey);
        if (backup) {
          const backupData = JSON.parse(backup);
          localStorage.setItem(backupData.key, JSON.stringify(backupData.value));
        }
      }

      toast.success('Data restored from cloud backup');
      
      // Record this restore operation
      localStorage.setItem('last_restore', JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'cloud',
        items: backupsToRestore.length
      }));
    } catch (error) {
      console.error('Error restoring from backup:', error);
      toast.error('Failed to restore from cloud backup');
    }
  }
  
  async deleteBackup(timestamp: string): Promise<void> {
    try {
      const userId = 'local-user-id';
      const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('cloud_backup_'));
      
      // Find backups with matching timestamp
      const keysToDelete = backupKeys.filter(key => {
        const backup = localStorage.getItem(key);
        if (backup) {
          const backupData = JSON.parse(backup);
          return backupData.updated_at === timestamp;
        }
        return false;
      });
      
      if (keysToDelete.length === 0) {
        toast.error('No backup found with the specified timestamp');
        return;
      }
      
      // Delete the backups
      keysToDelete.forEach(key => localStorage.removeItem(key));
      
      toast.success('Backup deleted successfully');
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Failed to delete backup');
    }
  }
}

export const supabaseBackup = LocalBackupService.getInstance();
