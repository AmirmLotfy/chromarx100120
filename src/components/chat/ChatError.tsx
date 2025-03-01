
import { useState } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ChatErrorProps {
  error: Error | string;
  onRetry?: () => void;
}

const ChatError = ({ error, onRetry }: ChatErrorProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Error processing request
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="ml-2 h-7"
          >
            <RefreshCcw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p>{errorMessage}</p>
        {errorMessage.includes('network') && 
          <p className="text-xs mt-1">Check your internet connection and try again.</p>
        }
        {errorMessage.includes('limit') && 
          <p className="text-xs mt-1">You've reached the API rate limit. Please try again later.</p>
        }
        {error instanceof Error && error.stack && (
          <>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto mt-1 text-xs"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide details' : 'Show technical details'}
            </Button>
            {showDetails && (
              <pre className="text-xs mt-2 p-2 bg-black/10 rounded overflow-x-auto">
                {error.stack}
              </pre>
            )}
          </>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ChatError;
