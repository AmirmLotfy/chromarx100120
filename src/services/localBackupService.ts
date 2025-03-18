
import { localStorageClient } from '@/lib/chrome-storage-client';
import { toast } from "sonner";

export interface BackupData {
  bookmarks: any[];
  notes: any[];
  tasks: any[];
  timestamp: string;
}

export interface BackupRecord {
  id: string;
  key: string;
  value: BackupData;
  user_id: string;
  created_at: string;
}

export const localBackup = {
  async syncAll(): Promise<boolean> {
    try {
      console.log('Running local backup sync...');
      
      // Get all local data
      const bookmarks = localStorage.getItem('bookmarks') ? 
        JSON.parse(localStorage.getItem('bookmarks') || '[]') : [];
      
      const notes = localStorage.getItem('notes') ? 
        JSON.parse(localStorage.getItem('notes') || '[]') : [];
      
      const tasks = localStorage.getItem('tasks') ? 
        JSON.parse(localStorage.getItem('tasks') || '[]') : [];
      
      // Save to chrome storage for sync
      const result = await localStorageClient
        .from('backups')
        .insert({
          id: `backup-${Date.now()}`,
          key: 'full_backup',
          value: {
            bookmarks,
            notes,
            tasks,
            timestamp: new Date().toISOString()
          },
          user_id: 'local-user',
          created_at: new Date().toISOString()
        })
        .execute();
      
      if (result.error) {
        console.error('Backup failed:', result.error);
        return false;
      }
      
      console.log('Backup completed successfully');
      return true;
    } catch (error) {
      console.error('Backup failed:', error);
      return false;
    }
  },
  
  async restore(): Promise<boolean> {
    try {
      // Get the latest backup
      const result = await localStorageClient
        .from('backups')
        .select()
        .eq('user_id', 'local-user')
        .eq('key', 'full_backup')
        .execute();
      
      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        toast.error('No backup found to restore');
        return false;
      }
      
      // Sort by timestamp to get the latest
      const backupRecords = result.data as BackupRecord[];
      const latestBackup = backupRecords.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      })[0];
      
      if (!latestBackup || !latestBackup.value) {
        toast.error('Backup data is corrupted');
        return false;
      }
      
      const { bookmarks, notes, tasks } = latestBackup.value;
      
      // Restore data
      if (bookmarks) localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
      if (notes) localStorage.setItem('notes', JSON.stringify(notes));
      if (tasks) localStorage.setItem('tasks', JSON.stringify(tasks));
      
      toast.success('Data restored successfully');
      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      toast.error('Failed to restore data');
      return false;
    }
  }
};
