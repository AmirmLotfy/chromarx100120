
import React from "react";
import ChatMessages from "../ChatMessages";
import BookmarkSearchView from "./BookmarkSearchView";
import ChatOfflineNotice from "./ChatOfflineNotice";
import { AIProgressIndicator } from "../ui/ai-progress-indicator";
import { X, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Message } from "@/types/chat";

interface ChatMainContentProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isOffline: boolean;
  isAIAvailable: boolean;
  checkConnection: () => void;
  error: Error | null;
  retryLastMessage: () => void;
  isProcessing: boolean;
  isBookmarkSearchMode: boolean;
}

const ChatMainContent: React.FC<ChatMainContentProps> = ({
  messages,
  messagesEndRef,
  isOffline,
  isAIAvailable,
  checkConnection,
  error,
  retryLastMessage,
  isProcessing,
  isBookmarkSearchMode
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Notifications section */}
      <div className="px-3 pt-2">
        {(isOffline || !isAIAvailable) && (
          <ChatOfflineNotice 
            isOffline={isOffline} 
            isAIUnavailable={!isAIAvailable && !isOffline} 
            onRetryConnection={checkConnection}
          />
        )}
        
        {error && (
          <div className="mb-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
            <div className="flex gap-2 items-start">
              <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center mt-0.5">
                <X size={12} className="text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">{error.message || "Error"}</p>
                <p className="text-xs mt-1 text-destructive/90">{error.message}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 h-8 text-xs"
                  onClick={retryLastMessage}
                >
                  <RefreshCw size={14} className="mr-1" /> Retry
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {isProcessing && (
          <div className="mb-3">
            <AIProgressIndicator 
              isLoading={true} 
              variant="minimal" 
              message="Processing with AI..." 
              className="bg-transparent"
            />
          </div>
        )}
      </div>
      
      {/* Chat messages section */}
      {isBookmarkSearchMode ? (
        <BookmarkSearchView />
      ) : (
        <ChatMessages 
          messages={messages} 
          messagesEndRef={messagesEndRef} 
        />
      )}
    </div>
  );
};

export default ChatMainContent;
