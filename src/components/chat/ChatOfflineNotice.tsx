import { WifiOff, CloudOff, RefreshCw, Download } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useState } from "react";

interface ChatOfflineNoticeProps {
  isOffline?: boolean;
  isAIUnavailable?: boolean;
  onRetryConnection?: () => void;
}

const ChatOfflineNotice = ({ 
  isOffline, 
  isAIUnavailable, 
  onRetryConnection 
}: ChatOfflineNoticeProps) => {
  const isMobile = useIsMobile();
  const offlineStatus = useOfflineStatus();
  const { isActive, updateAvailable, skipWaiting } = useServiceWorker({
    path: '/improved-service-worker.js',
    showToasts: false
  });
  const [isChecking, setIsChecking] = useState(false);
  
  // Use the passed isOffline prop if provided, otherwise use the hook's value
  const isActuallyOffline = isOffline !== undefined ? isOffline : offlineStatus.isOffline;
  
  const handleRetryConnection = async () => {
    setIsChecking(true);
    if (onRetryConnection) {
      await onRetryConnection();
    } else {
      await offlineStatus.checkConnection();
    }
    setIsChecking(false);
  };
  
  const handleUpdate = async () => {
    await skipWaiting();
    window.location.reload();
  };
  
  if (!isActuallyOffline && !isAIUnavailable && !updateAvailable) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Alert 
        variant="default"
        className={`mb-3 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-500/30 rounded-lg overflow-hidden ${isMobile ? 'p-3' : ''}`}
      >
        {updateAvailable ? (
          <div className="flex gap-2">
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Download className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-amber-600 dark:text-amber-400`} />
            </div>
            <div className="flex-1">
              <AlertTitle className={`${isMobile ? 'text-sm' : ''} mb-1`}>Update available</AlertTitle>
              <AlertDescription className={isMobile ? 'text-[0.7rem]' : 'text-xs'}>
                <p>An improved offline experience is available.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpdate}
                  className={`mt-2 ${isMobile ? 'h-6 text-[0.7rem] py-0' : 'h-7 text-xs'}`}
                >
                  <Download className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
                  Update now
                </Button>
              </AlertDescription>
            </div>
          </div>
        ) : isActuallyOffline ? (
          <div className="flex gap-2">
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <WifiOff className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-amber-600 dark:text-amber-400`} />
            </div>
            <div className="flex-1">
              <AlertTitle className={`${isMobile ? 'text-sm' : ''} mb-1`}>You're offline</AlertTitle>
              <AlertDescription className={isMobile ? 'text-[0.7rem]' : 'text-xs'}>
                <p>{isActive ? 'Working in offline mode. Changes will sync when connection is restored.' : 'Chat will have limited functionality until your connection is restored.'}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryConnection}
                  disabled={isChecking}
                  className={`mt-2 ${isMobile ? 'h-6 text-[0.7rem] py-0' : 'h-7 text-xs'}`}
                >
                  <RefreshCw className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1 ${isChecking ? 'animate-spin' : ''}`} />
                  {isChecking ? 'Checking...' : 'Check connection'}
                </Button>
              </AlertDescription>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <CloudOff className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-amber-600 dark:text-amber-400`} />
            </div>
            <div className="flex-1">
              <AlertTitle className={`${isMobile ? 'text-sm' : ''} mb-1`}>AI service unavailable</AlertTitle>
              <AlertDescription className={isMobile ? 'text-[0.7rem]' : 'text-xs'}>
                <p>The AI service is currently unavailable.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryConnection}
                  disabled={isChecking}
                  className={`mt-2 ${isMobile ? 'h-6 text-[0.7rem] py-0' : 'h-7 text-xs'}`}
                >
                  <RefreshCw className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1 ${isChecking ? 'animate-spin' : ''}`} />
                  {isChecking ? 'Retrying...' : 'Retry'}
                </Button>
              </AlertDescription>
            </div>
          </div>
        )}
      </Alert>
    </motion.div>
  );
};

export default ChatOfflineNotice;
