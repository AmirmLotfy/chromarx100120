
import React from "react";
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
  
  // Remove the useEffect that was causing the infinite loop
  // The markMessagesAsRead will be called from ChatInterface instead

  return (
    <div className="flex-1 flex flex-col">
      {/* Notifications section */}
      <div className="sticky top-0 z-10 px-3 pt-2 space-y-2 bg-background/95 backdrop-blur-sm">
        <AnimatePresence>
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
              className="mb-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-xl text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex gap-2 items-start">
                <div className="h-6 w-6 rounded-full bg-destructive/20 flex items-center justify-center mt-0.5">
                  <X size={12} className="text-destructive" />
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
        </AnimatePresence>
      </div>
      
      {/* Chat messages section with improved scrolling */}
      <div className="flex-1 overflow-y-auto px-1 pb-4 scroll-smooth">
        <AnimatePresence mode="wait">
          {isBookmarkSearchMode ? (
            <BookmarkSearchView key="search" />
          ) : (
            <div className="pb-6">
              <ChatMessages 
                key="messages"
                messages={messages} 
                messagesEndRef={messagesEndRef}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatMainContent;
