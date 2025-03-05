
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useSettings } from '@/stores/settingsStore';
import { formatBytes } from '@/lib/utils';
import { WifiOff, RefreshCw, Database, Zap, LayoutGrid } from 'lucide-react';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { Button } from '@/components/ui/button';
import { syncService } from '@/services/syncService';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

const OfflineSettings = () => {
  const { user } = useAuth();
  const { offlineMode, offlineDataLimit, offlinePriority, setOfflineMode, setOfflineDataLimit, setOfflinePriority } = useSettings();
  const { isOnline, pendingChanges, syncInProgress, lastSynced } = useSyncStatus();
  const { isOffline } = useOfflineStatus();

  const handleSyncNow = async () => {
    if (!user) {
      toast.error("You must be signed in to sync");
      return;
    }
    
    if (isOffline) {
      toast.warning("You're currently offline. Changes will sync when you're back online.");
      return;
    }
    
    try {
      toast.info("Starting sync...");
      await syncService.processOfflineQueue();
      toast.success("Sync completed successfully");
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Sync failed. Please try again later");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-5 w-5 text-primary" />
            Offline Mode
          </CardTitle>
          <CardDescription>
            Configure how the extension works when you're offline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="offline-mode">Offline Behavior</Label>
            <RadioGroup
              id="offline-mode"
              value={offlineMode}
              onValueChange={(value) => setOfflineMode(value as 'auto' | 'always' | 'never')}
              className="grid grid-cols-1 gap-2"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="auto" id="auto" className="mt-1" />
                <div className="grid gap-1">
                  <Label htmlFor="auto" className="font-medium">Automatic (Recommended)</Label>
                  <p className="text-muted-foreground text-sm">
                    Automatically detect connection status and adjust behavior accordingly
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="always" id="always" className="mt-1" />
                <div className="grid gap-1">
                  <Label htmlFor="always" className="font-medium">Always Enable Offline Mode</Label>
                  <p className="text-muted-foreground text-sm">
                    Keep all data locally cached and minimize network usage, even when online
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="never" id="never" className="mt-1" />
                <div className="grid gap-1">
                  <Label htmlFor="never" className="font-medium">Never Use Offline Features</Label>
                  <p className="text-muted-foreground text-sm">
                    Always require an internet connection (not recommended)
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="offline-data-limit">Offline Data Limit: {formatBytes(offlineDataLimit * 1024 * 1024)}</Label>
            </div>
            <Slider
              id="offline-data-limit"
              min={10}
              max={500}
              step={10}
              value={[offlineDataLimit]}
              onValueChange={(values) => setOfflineDataLimit(values[0])}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Limit how much data is stored for offline use. Chrome extensions have limited storage.
            </p>
          </div>
          
          <div className="space-y-2 pt-4 border-t">
            <Label>Offline Priority</Label>
            <RadioGroup
              value={offlinePriority}
              onValueChange={(value) => setOfflinePriority(value as 'performance' | 'storage' | 'balanced')}
              className="grid grid-cols-1 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="performance" id="performance" />
                <div className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <Label htmlFor="performance" className="font-medium">Performance</Label>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="storage" id="storage" />
                <div className="flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="storage" className="font-medium">Storage Efficiency</Label>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="balanced" id="balanced" />
                <div className="flex items-center gap-1.5">
                  <LayoutGrid className="h-4 w-4 text-green-500" />
                  <Label htmlFor="balanced" className="font-medium">Balanced (Recommended)</Label>
                </div>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-1">
              Choose what to prioritize when offline: speed, storage space, or a balance of both
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Sync Status
          </CardTitle>
          <CardDescription>
            Manage sync settings and see sync status across your devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Current Status</h4>
              <span className={`text-sm px-2 py-0.5 rounded-full ${isOnline ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            <div className="text-sm space-y-1.5 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Changes:</span>
                <span className="font-medium">{pendingChanges}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Synced:</span>
                <span className="font-medium">
                  {lastSynced 
                    ? new Date(lastSynced).toLocaleString() 
                    : 'Never'}
                </span>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              disabled={isOffline || syncInProgress || pendingChanges === 0}
              onClick={handleSyncNow}
            >
              {syncInProgress ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-Sync When Online</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync changes when internet connection is restored
                </p>
              </div>
              <Switch disabled={true} checked={true} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Sync Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications for sync status and errors
                </p>
              </div>
              <Switch disabled={true} checked={true} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Background Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Periodically sync in the background when possible
                </p>
              </div>
              <Switch disabled={true} checked={true} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineSettings;
