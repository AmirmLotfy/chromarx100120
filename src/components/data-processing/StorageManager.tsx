
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getStorageUsage, cleanupExpiredItems, getAllStorageKeys, clearStorage } from '@/utils/chromeStorageUtils';
import { toast } from 'sonner';

export function StorageManager() {
  const [storageUsage, setStorageUsage] = useState<{
    bytesInUse: number;
    quotaBytes: number;
    percentUsed: number;
  } | null>(null);
  
  const [keys, setKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  
  // Refresh storage usage data
  const refreshStorageData = async () => {
    setIsLoading(true);
    try {
      const [usage, allKeys] = await Promise.all([
        getStorageUsage(),
        getAllStorageKeys()
      ]);
      
      setStorageUsage(usage);
      setKeys(allKeys);
    } catch (error) {
      console.error('Error refreshing storage data:', error);
      toast.error('Failed to refresh storage data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clean up expired items
  const handleCleanupExpired = async () => {
    setIsCleaning(true);
    try {
      const removedCount = await cleanupExpiredItems();
      
      if (removedCount > 0) {
        toast.success(`Removed ${removedCount} expired items`);
      } else {
        toast.info('No expired items to remove');
      }
      
      // Refresh the data
      await refreshStorageData();
    } catch (error) {
      console.error('Error cleaning up expired items:', error);
      toast.error('Failed to clean up expired items');
    } finally {
      setIsCleaning(false);
    }
  };
  
  // Clear all storage
  const handleClearStorage = async () => {
    // Confirm before clearing
    if (!window.confirm('Are you sure you want to clear all storage? This action cannot be undone.')) {
      return;
    }
    
    setIsCleaning(true);
    try {
      const success = await clearStorage();
      
      if (success) {
        toast.success('Storage cleared successfully');
      } else {
        toast.error('Failed to clear storage');
      }
      
      // Refresh the data
      await refreshStorageData();
    } catch (error) {
      console.error('Error clearing storage:', error);
      toast.error('Failed to clear storage');
    } finally {
      setIsCleaning(false);
    }
  };
  
  // Format bytes to human-readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Get badge variant based on percentage
  const getUsageVariant = (percent: number) => {
    if (percent > 90) return 'destructive';
    if (percent > 70) return 'warning';
    return 'success';
  };
  
  // Load initial data
  useEffect(() => {
    refreshStorageData();
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chrome Storage Manager</CardTitle>
        <CardDescription>
          Manage and monitor chrome.storage.local usage
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading storage data...
          </div>
        ) : (
          <>
            {storageUsage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Storage Usage</span>
                  <Badge variant={getUsageVariant(storageUsage.percentUsed)}>
                    {storageUsage.percentUsed.toFixed(1)}%
                  </Badge>
                </div>
                
                <Progress 
                  value={storageUsage.percentUsed} 
                  className={`h-2 ${
                    storageUsage.percentUsed > 90 
                      ? 'bg-destructive/20' 
                      : storageUsage.percentUsed > 70 
                        ? 'bg-warning/20' 
                        : 'bg-success/20'
                  }`}
                />
                
                <div className="text-sm text-muted-foreground flex justify-between">
                  <span>
                    {formatBytes(storageUsage.bytesInUse)} used
                  </span>
                  <span>
                    {formatBytes(storageUsage.quotaBytes)} total
                  </span>
                </div>
                
                {storageUsage.percentUsed > 90 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                      Storage usage is very high! Consider clearing unused data.
                    </AlertDescription>
                  </Alert>
                )}
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Storage Keys ({keys.length})</h3>
                  <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                    {keys.length > 0 ? (
                      <ul className="space-y-1">
                        {keys.map((key) => (
                          <li key={key} className="text-sm">
                            {key.length > 40 ? key.substring(0, 37) + '...' : key}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No data in storage
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Chrome storage API not available
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={refreshStorageData} 
          disabled={isLoading}
        >
          Refresh
        </Button>
        
        <div className="space-x-2">
          <Button
            variant="secondary"
            onClick={handleCleanupExpired}
            disabled={isLoading || isCleaning}
          >
            Clean Expired
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleClearStorage}
            disabled={isLoading || isCleaning}
          >
            Clear All
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default StorageManager;
