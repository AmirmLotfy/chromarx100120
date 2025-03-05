
import React from "react";
import { Menu, ChevronLeft, Sparkles, X, Search, Bookmark, BookmarkPlus } from "lucide-react";
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
  const handleToggleSidebar = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  return (
    <motion.div 
      className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm z-10 sticky top-0"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleSidebar}
          className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"
          aria-label={isHistoryOpen ? "Close menu" : "Open menu"}
        >
          {isHistoryOpen ? 
            <ChevronLeft size={20} className="text-primary" /> : 
            <Menu size={20} className="text-muted-foreground" />
          }
        </motion.button>
        
        <div className="flex flex-col">
          <h1 className="text-sm font-medium flex items-center gap-2 truncate max-w-[160px] sm:max-w-[220px]">
            {activeConversation?.name || "New Chat"}
            {activeConversation?.pinned && (
              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </h1>
          <p className="text-xs text-muted-foreground truncate max-w-[160px] sm:max-w-[220px]">
            {messagesCount === 0 
              ? "Start a conversation" 
              : `${messagesCount} messages${activeConversation?.category ? ` • ${activeConversation.category}` : ''}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isBookmarkSearchMode && activeConversation && (
          <Button
            onClick={clearChat}
            size="sm"
            variant="ghost"
            className="h-9 text-xs font-normal"
          >
            <Sparkles size={15} className="mr-1.5" />
            New Chat
          </Button>
        )}

        <motion.button
          initial={false}
          whileTap={{ scale: 0.95 }}
          onClick={toggleBookmarkSearchMode}
          className={cn(
            "relative h-9 px-4 rounded-full text-xs font-medium flex items-center gap-2 transition-colors",
            isBookmarkSearchMode 
              ? "bg-destructive/90 text-destructive-foreground hover:bg-destructive" 
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          <motion.div
            initial={false}
            animate={{ 
              rotate: isBookmarkSearchMode ? 0 : 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 0.4 }}
            className="flex-shrink-0"
          >
            {isBookmarkSearchMode ? (
              <X size={15} />
            ) : (
              <Search size={15} />
            )}
          </motion.div>
          <span>{isBookmarkSearchMode ? "Exit Search" : "Search"}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ChatHeader;
