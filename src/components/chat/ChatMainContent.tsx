
import React from "react";
import ChatMessages from "../ChatMessages";
import BookmarkSearchView from "./BookmarkSearchView";
import { RefreshCw, X, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { Message } from "@/types/chat";
import { motion, AnimatePresence } from "framer-motion";
import { AIProgressIndicator } from "../ui/ai-progress-indicator";

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
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="sticky top-0 z-10 px-3 pt-2 space-y-2 bg-background/90 backdrop-blur-sm">
        <AnimatePresence>
          {(isOffline || !isAIAvailable) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="scale-95 origin-top"
            >
              <div className="rounded-lg p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-amber-800 dark:text-amber-300 text-sm flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">
                    {isOffline ? "You are offline" : "AI service unavailable"}
                  </p>
                  <p className="text-xs mt-1">
                    {isOffline 
                      ? "Check your internet connection to continue chatting" 
                      : "The AI service is currently unavailable. Please try again later."}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 h-8 text-xs border-amber-200 dark:border-amber-800/50 bg-amber-100/50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    onClick={checkConnection}
                  >
                    <RefreshCw size={12} className="mr-1.5" /> Check connection
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
          
          {error && (
            <motion.div 
              className="rounded-lg p-3 bg-destructive/10 border border-destructive/20 text-sm text-destructive"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex gap-3 items-start">
                <div className="h-6 w-6 rounded-full bg-destructive/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <X size={12} className="text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm line-clamp-2">{error.message || "Error"}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 h-8 text-xs border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10"
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
      
      <div className="flex-1 overflow-y-auto pb-4 scroll-smooth">
        <AnimatePresence mode="wait">
          {isBookmarkSearchMode ? (
            <BookmarkSearchView key="search" />
          ) : (
            <div className="p-3">
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
