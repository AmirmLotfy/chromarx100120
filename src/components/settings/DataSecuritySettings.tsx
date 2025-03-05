
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Shield, Download, AlertTriangle, Trash2, HardDrive, History } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/stores/settingsStore';
import { cleanupData, exportUserData } from '@/utils/cleanupUtils';

const DataSecuritySettings = () => {
  const { user } = useAuth();
  const settings = useSettings();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const jsonData = await exportUserData();
      
      // Create download
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chromarx-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    try {
      setIsDeleting(true);
      await cleanupData(['all']);
      setShowDeleteDialog(false);
      toast.success('All data has been deleted');
      // Reload the page to reflect the changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error('Failed to delete data');
      console.error('Data deletion error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleHistoryRetentionChange = (value: boolean) => {
    settings.setHistoryRetention(value);
    toast.success(`History retention ${value ? 'enabled' : 'disabled'}`);
  };

  const handleLocalStorageEncryptionChange = (value: boolean) => {
    settings.setLocalStorageEncryption(value);
    toast.success(`Local storage encryption ${value ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Data Security & Privacy</h2>
      <p className="text-sm text-muted-foreground">
        Control how your data is stored, used, and protected
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Data Protection
          </CardTitle>
          <CardDescription>
            Manage your data security and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="history-retention" className="font-medium">History Retention</Label>
              <p className="text-sm text-muted-foreground">
                Store your bookmark access history
              </p>
            </div>
            <Switch
              id="history-retention"
              checked={settings.historyRetention}
              onCheckedChange={handleHistoryRetentionChange}
            />
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="local-encryption" className="font-medium">Local Storage Encryption</Label>
              <p className="text-sm text-muted-foreground">
                Encrypt sensitive data stored locally
              </p>
            </div>
            <Switch
              id="local-encryption"
              checked={settings.localStorageEncryption}
              onCheckedChange={handleLocalStorageEncryptionChange}
            />
          </div>

          <Separator className="my-2" />
          
          <div className="flex flex-col gap-4 py-2">
            <h3 className="text-sm font-medium">Data Management</h3>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportData} 
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export Your Data
              </Button>
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete All Data
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {user ? 
                "Your data is stored locally and in the cloud with your account. You can export or delete it anytime." : 
                "Your data is currently stored only on this device. Sign in to enable cloud backup."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Bookmark History</span>
              </div>
              <span className="text-sm font-medium">{settings.historyItems || 0} items</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Cached Data</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => storage.clearCache()}>
                Clear Cache
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete All Data
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all your stored data including bookmarks, settings, and history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium text-destructive">Are you absolutely sure you want to continue?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAllData} 
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete All Data'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataSecuritySettings;
