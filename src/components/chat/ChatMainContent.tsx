
import React, { useEffect } from "react";
import ChatMessages from "../ChatMessages";
import BookmarkSearchView from "./BookmarkSearchView";
import ChatOfflineNotice from "./ChatOfflineNotice";
import { AIProgressIndicator } from "../ui/ai-progress-indicator";
import { RefreshCw, X } from "lucide-react";
import { Button } from "../ui/button";
import { Message } from "@/types/chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

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
}) => {
  const isMobile = useIsMobile();
  
  // Mark messages as read when they are viewed
  useEffect(() => {
    if (messages.length > 0 && markMessagesAsRead) {
      markMessagesAsRead();
    }
  }, [messages, markMessagesAsRead]);

  return (
    <motion.div 
      className="flex-1 flex flex-col overflow-hidden relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Notifications section */}
      <AnimatePresence>
        <div className={`${isMobile ? 'px-3 pt-2' : 'px-4 pt-3'} space-y-2`}>
          {(isOffline || !isAIAvailable) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <ChatOfflineNotice 
                isOffline={isOffline} 
                isAIUnavailable={!isAIAvailable && !isOffline} 
                onRetryConnection={checkConnection}
              />
            </motion.div>
          )}
          
          {error && (
            <motion.div 
              className="mb-2 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex gap-2 items-start">
                <div className={`h-6 w-6 rounded-full bg-destructive/20 flex items-center justify-center ${isMobile ? 'mt-0' : 'mt-0.5'}`}>
                  <X size={14} className="text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-destructive text-xs">{error.message || "Error"}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 h-7 text-xs"
                    onClick={retryLastMessage}
                  >
                    <RefreshCw size={12} className="mr-1.5" /> Retry
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
          
          {isProcessing && (
            <motion.div 
              className="mb-2"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <AIProgressIndicator 
                isLoading={true} 
                variant="minimal" 
                message="Processing..." 
                className="bg-transparent"
              />
            </motion.div>
          )}
        </div>
      </AnimatePresence>
      
      {/* Chat messages section */}
      <AnimatePresence mode="wait">
        {isBookmarkSearchMode ? (
          <BookmarkSearchView key="search" />
        ) : (
          <ChatMessages 
            key="messages"
            messages={messages} 
            messagesEndRef={messagesEndRef}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChatMainContent;
