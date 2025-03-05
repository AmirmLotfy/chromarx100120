
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
  
  return (
    <div className="flex-1 flex flex-col max-h-[calc(100%-1rem)] overflow-hidden">
      {/* Notifications section - made more compact */}
      <div className="sticky top-0 z-10 px-2 pt-1 space-y-1 bg-background/95 backdrop-blur-sm">
        <AnimatePresence>
          {(isOffline || !isAIAvailable) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="scale-95 origin-top"
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
              className="mb-1 px-2 py-1 bg-destructive/10 border border-destructive/20 rounded-xl text-xs"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex gap-2 items-start">
                <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center mt-0.5">
                  <X size={10} className="text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-destructive text-xs">{error.message || "Error"}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-1 h-6 text-xs"
                    onClick={retryLastMessage}
                  >
                    <RefreshCw size={10} className="mr-1" /> Retry
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
          
          {isProcessing && (
            <motion.div 
              className="mb-1"
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
      <div className="flex-1 overflow-y-auto px-1 pb-3 scroll-smooth">
        <AnimatePresence mode="wait">
          {isBookmarkSearchMode ? (
            <BookmarkSearchView key="search" />
          ) : (
            <div className="pb-2">
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
