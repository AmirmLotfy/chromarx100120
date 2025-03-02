
import React, { useEffect } from "react";
import ChatMessages from "../ChatMessages";
import BookmarkSearchView from "./BookmarkSearchView";
import ChatOfflineNotice from "./ChatOfflineNotice";
import { AIProgressIndicator } from "../ui/ai-progress-indicator";
import { X, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Message } from "@/types/chat";
import { useIsMobile } from "@/hooks/use-mobile";

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
  markMessagesAsRead?: () => void;
  viewMode?: "grid" | "list";
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
  isBookmarkSearchMode,
  markMessagesAsRead,
  viewMode = "list"
}) => {
  const isMobile = useIsMobile();
  
  // Mark messages as read when they are viewed
  useEffect(() => {
    if (messages.length > 0 && markMessagesAsRead) {
      markMessagesAsRead();
    }
  }, [messages, markMessagesAsRead]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-transparent to-background/30">
      {/* Notifications section */}
      <div className={`${isMobile ? 'px-3 pt-1.5' : 'px-4 pt-2'}`}>
        {(isOffline || !isAIAvailable) && (
          <ChatOfflineNotice 
            isOffline={isOffline} 
            isAIUnavailable={!isAIAvailable && !isOffline} 
            onRetryConnection={checkConnection}
          />
        )}
        
        {error && (
          <div className="mb-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm">
            <div className="flex gap-2 items-start">
              <div className={`h-6 w-6 rounded-full bg-destructive/20 flex items-center justify-center ${isMobile ? 'mt-0' : 'mt-0.5'}`}>
                <X size={14} className="text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">{error.message || "Error"}</p>
                <p className={`${isMobile ? 'text-[0.7rem]' : 'text-xs'} mt-1 text-destructive/90`}>{error.message}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`mt-2 ${isMobile ? 'h-7 text-[0.7rem]' : 'h-8 text-xs'}`}
                  onClick={retryLastMessage}
                >
                  <RefreshCw size={isMobile ? 12 : 14} className="mr-1" /> Retry
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
          viewMode={viewMode}
        />
      )}
    </div>
  );
};

export default ChatMainContent;
