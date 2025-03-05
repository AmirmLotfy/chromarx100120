
import React from "react";
import ChatMessages from "../ChatMessages";
import BookmarkSearchView from "./BookmarkSearchView";
import ChatOfflineNotice from "./ChatOfflineNotice";
import { AIProgressIndicator } from "../ui/ai-progress-indicator";
import { RefreshCw, X, BookmarkPlus, Globe } from "lucide-react";
import { Button } from "../ui/button";
import { Message } from "@/types/chat";
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
  const renderSearchResults = (message: Message) => {
    if (!message.bookmarks?.length && !message.webResults?.length) return null;
    
    return (
      <div className="mt-3 space-y-2 bg-gradient-to-br from-muted/40 to-muted/20 p-3 rounded-xl border border-primary/5">
        {message.bookmarks && message.bookmarks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-primary/80 flex items-center gap-1.5">
              <BookmarkPlus className="h-3.5 w-3.5" />
              Your Bookmarks
            </h4>
            <div className="space-y-1.5">
              {message.bookmarks.map((bookmark, i) => (
                <a 
                  key={i} 
                  href={bookmark.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-xs p-2.5 bg-background hover:bg-primary/5 rounded-lg transition-colors border border-primary/10 hover:border-primary/20"
                >
                  <span className="font-medium line-clamp-1">{bookmark.title}</span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">{bookmark.url}</span>
                </a>
              ))}
            </div>
          </div>
        )}
        
        {message.webResults && message.webResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-primary/80 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Web Results
            </h4>
            <div className="space-y-1.5">
              {message.webResults.map((result, i) => (
                <a 
                  key={i} 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-xs p-2.5 bg-background hover:bg-primary/5 rounded-lg transition-colors border border-primary/10 hover:border-primary/20"
                >
                  <span className="font-medium line-clamp-1">{result.title}</span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">{result.url}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="sticky top-0 z-10 px-2 pt-1.5 space-y-1.5 bg-background/90 backdrop-blur-sm">
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
              className="mb-1.5 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-xl text-xs"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex gap-2 items-start">
                <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <X size={12} className="text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-destructive text-xs line-clamp-2">{error.message || "Error"}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-1.5 h-7 text-xs"
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
              className="mb-1.5"
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
      
      <div className="flex-1 overflow-y-auto px-2 pb-3 scroll-smooth">
        <AnimatePresence mode="wait">
          {isBookmarkSearchMode ? (
            <BookmarkSearchView key="search" />
          ) : (
            <div className="py-2">
              <ChatMessages 
                key="messages"
                messages={messages} 
                messagesEndRef={messagesEndRef}
                renderAdditionalContent={renderSearchResults}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatMainContent;
