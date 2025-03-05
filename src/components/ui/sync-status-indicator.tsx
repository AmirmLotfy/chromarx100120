
import React from 'react';
import { RefreshCw, CloudOff, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { syncService } from '@/services/syncService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SyncStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
  showLastSync?: boolean;
  interactive?: boolean;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  className,
  showLabel = true,
  showLastSync = false,
  interactive = false
}) => {
  const { user } = useAuth();
  const { isOnline, status, lastSynced, pendingChanges, syncInProgress } = useSyncStatus();
  
  const handleForceSyncClick = async () => {
    if (!user) {
      toast.error("You must be signed in to sync");
      return;
    }
    
    if (!isOnline) {
      toast.warning("You are offline. Changes will sync when you're back online");
      return;
    }
    
    if (syncInProgress) {
      toast.info("Sync already in progress");
      return;
    }
    
    try {
      await syncService.processOfflineQueue();
      toast.success("Sync completed successfully");
    } catch (error) {
      toast.error("Sync failed. Please try again later");
      console.error("Sync error:", error);
    }
  };
  
  let icon, label, colorClass;
  
  if (!isOnline) {
    icon = <CloudOff className="h-4 w-4" />;
    label = "Offline";
    colorClass = "text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30";
  } else if (syncInProgress) {
    icon = <RefreshCw className="h-4 w-4 animate-spin" />;
    label = "Syncing...";
    colorClass = "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-500/30";
  } else if (status === 'error') {
    icon = <AlertTriangle className="h-4 w-4" />;
    label = "Sync Error";
    colorClass = "text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-500/30";
  } else if (pendingChanges > 0) {
    icon = <RefreshCw className="h-4 w-4" />;
    label = `${pendingChanges} Pending Changes`;
    colorClass = "text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-500/30";
  } else {
    icon = <Check className="h-4 w-4" />;
    label = "Synced";
    colorClass = "text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-500/30";
  }
  
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-md border",
      colorClass,
      className
    )}>
      {icon}
      {showLabel && <span className="text-sm font-medium">{label}</span>}
      
      {showLastSync && lastSynced && (
        <span className="text-xs text-muted-foreground ml-2">
          Last sync: {formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}
        </span>
      )}
      
      {interactive && (
        <Button 
          size="sm" 
          variant="ghost" 
          className="ml-auto h-7 px-2 text-xs"
          onClick={handleForceSyncClick}
          disabled={syncInProgress || !isOnline}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Sync
        </Button>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
