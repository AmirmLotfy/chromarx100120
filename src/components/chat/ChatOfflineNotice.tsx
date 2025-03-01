
import { AlertCircle, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";

interface ChatOfflineNoticeProps {
  isOffline: boolean;
  isAIUnavailable: boolean;
  onRetryConnection: () => void;
}

const ChatOfflineNotice = ({
  isOffline,
  isAIUnavailable,
  onRetryConnection,
}: ChatOfflineNoticeProps) => {
  const Icon = isOffline ? WifiOff : AlertCircle;
  const title = isOffline
    ? "You're offline"
    : "AI service unavailable";
  const description = isOffline
    ? "Please check your internet connection to continue chatting."
    : "The AI service is currently unavailable. Please try again later.";

  return (
    <Alert 
      variant="warning" 
      className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-500/30 flex items-start"
    >
      <div className="flex flex-col space-y-2 w-full">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-amber-500" />
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {title}
          </h4>
        </div>
        
        <AlertDescription className="text-xs text-amber-700 dark:text-amber-300/90 mt-1 mb-2">
          {description}
        </AlertDescription>
        
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 bg-background/50 hover:bg-background text-amber-700 border-amber-200 hover:text-amber-800 dark:border-amber-800/30 dark:text-amber-300 dark:hover:text-amber-200"
            onClick={onRetryConnection}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry connection
          </Button>
        </div>
      </div>
    </Alert>
  );
};

export default ChatOfflineNotice;
