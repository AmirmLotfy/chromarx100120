
import { WifiOff, CloudOff, RefreshCw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ChatOfflineNoticeProps {
  isOffline: boolean;
  isAIUnavailable?: boolean;
  onRetryConnection?: () => void;
}

const ChatOfflineNotice = ({ 
  isOffline, 
  isAIUnavailable, 
  onRetryConnection 
}: ChatOfflineNoticeProps) => {
  if (!isOffline && !isAIUnavailable) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Alert 
        variant="default"
        className="mb-3 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-500/30 rounded-lg overflow-hidden"
      >
        {isOffline ? (
          <div className="flex gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <AlertTitle className="mb-1">You're offline</AlertTitle>
              <AlertDescription className="text-xs">
                <p>Chat will have limited functionality until your connection is restored.</p>
                {onRetryConnection && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetryConnection}
                    className="mt-2 h-7 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Check connection
                  </Button>
                )}
              </AlertDescription>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <CloudOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <AlertTitle className="mb-1">AI service unavailable</AlertTitle>
              <AlertDescription className="text-xs">
                <p>The AI service is currently unavailable.</p>
                {onRetryConnection && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetryConnection}
                    className="mt-2 h-7 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </div>
          </div>
        )}
      </Alert>
    </motion.div>
  );
};

export default ChatOfflineNotice;
