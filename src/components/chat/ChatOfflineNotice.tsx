
import { WifiOff, CloudOff, RefreshCw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
    <Alert 
      variant="default"
      className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-500/30"
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4 text-amber-600" />
          <AlertTitle className="flex items-center gap-2">
            You're offline
            {onRetryConnection && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetryConnection}
                className="ml-2 h-7"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Check connection
              </Button>
            )}
          </AlertTitle>
          <AlertDescription>
            <p>Chat will have limited functionality until your connection is restored.
            You can still view previous messages and interact with offline features.</p>
            <ol className="text-xs mt-2 list-decimal list-inside space-y-1">
              <li>Make sure your device is connected to the internet</li>
              <li>Try refreshing the extension</li>
              <li>If you're using a VPN, check if it's functioning properly</li>
            </ol>
          </AlertDescription>
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4 text-amber-600" />
          <AlertTitle className="flex items-center gap-2">
            AI service unavailable
            {onRetryConnection && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetryConnection}
                className="ml-2 h-7"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Retry
              </Button>
            )}
          </AlertTitle>
          <AlertDescription>
            <p>The AI service is currently unavailable. This could be due to:</p>
            <ul className="text-xs mt-1 list-disc list-inside space-y-1">
              <li>Temporary service outage</li>
              <li>API rate limits</li>
              <li>Network connectivity issues</li>
            </ul>
            <p className="text-xs mt-2">Your messages are saved and will be processed when the service is back online.</p>
          </AlertDescription>
        </>
      )}
    </Alert>
  );
};

export default ChatOfflineNotice;
