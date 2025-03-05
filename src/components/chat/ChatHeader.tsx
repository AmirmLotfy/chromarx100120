
import React from "react";
import { ChevronLeft, X, MessageSquare, BookmarkPlus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (isOpen: boolean) => void;
  activeConversation: any | undefined;
  messagesCount: number;
  isBookmarkSearchMode: boolean;
  toggleBookmarkSearchMode: () => void;
  clearChat: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isHistoryOpen,
  setIsHistoryOpen,
  activeConversation,
  messagesCount,
  isBookmarkSearchMode,
  toggleBookmarkSearchMode,
  clearChat,
}) => {
  return (
    <motion.div 
      className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur-sm z-10 sticky top-0"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center"
          aria-label={isHistoryOpen ? "Close sidebar" : "Open sidebar"}
        >
          <ChevronLeft size={18} className={cn(
            "text-muted-foreground transition-transform",
            isHistoryOpen ? "rotate-0" : "rotate-180"
          )} />
        </motion.button>
        
        <div>
          <h1 className="text-sm font-medium flex items-center gap-2">
            {activeConversation?.name || "New Chat"}
            {activeConversation?.pinned && (
              <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            )}
          </h1>
          <p className="text-xs text-muted-foreground">
            {messagesCount === 0 
              ? "Start a conversation" 
              : `${messagesCount} messages${activeConversation?.category ? ` • ${activeConversation.category}` : ''}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isBookmarkSearchMode && activeConversation && messagesCount > 1 && (
          <Button
            onClick={clearChat}
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
          >
            <X size={14} className="mr-1.5" />
            Clear
          </Button>
        )}

        <Button
          onClick={toggleBookmarkSearchMode}
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-xs",
            isBookmarkSearchMode ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""
          )}
          variant={isBookmarkSearchMode ? "destructive" : "default"}
        >
          {isBookmarkSearchMode ? (
            <>
              <X size={14} />
              <span>Exit Search</span>
            </>
          ) : (
            <>
              <BookmarkPlus size={14} />
              <span>Bookmarks</span>
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default ChatHeader;
