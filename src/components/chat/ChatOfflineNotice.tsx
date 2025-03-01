
import { WifiOff, CloudOff } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ChatOfflineNoticeProps {
  isOffline: boolean;
  isAIUnavailable?: boolean;
}

const ChatOfflineNotice = ({ isOffline, isAIUnavailable }: ChatOfflineNoticeProps) => {
  if (!isOffline && !isAIUnavailable) return null;
  
  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-500/30">
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4 text-amber-600" />
          <AlertTitle>You're offline</AlertTitle>
          <AlertDescription>
            Chat will have limited functionality until your connection is restored.
            You can still view previous messages.
          </AlertDescription>
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4 text-amber-600" />
          <AlertTitle>AI service unavailable</AlertTitle>
          <AlertDescription>
            The AI service is currently unavailable. Your messages are saved and will be processed
            when the service is back online.
          </AlertDescription>
        </>
      )}
    </Alert>
  );
};

export default ChatOfflineNotice;
