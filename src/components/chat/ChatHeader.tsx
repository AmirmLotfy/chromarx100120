
import React from "react";
import { Menu, MessageCircle, BookmarkPlus, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";

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
      className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur-sm z-10"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleSidebar}
          className="h-9 w-9 rounded-full hover:bg-accent flex items-center justify-center"
          aria-label={isHistoryOpen ? "Close menu" : "Open menu"}
        >
          {isHistoryOpen ? 
            <ChevronLeft size={18} className="text-primary" /> : 
            <Menu size={18} />
          }
        </motion.button>
        
        <div className="flex flex-col">
          <h1 className="text-sm font-medium flex items-center gap-1.5">
            {activeConversation?.name || "New Chat"}
            {activeConversation?.pinned && (
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
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
        {!isBookmarkSearchMode && activeConversation && (
          <Button
            onClick={clearChat}
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
          >
            New Chat
          </Button>
        )}

        <motion.button
          initial={false}
          whileTap={{ scale: 0.95 }}
          onClick={toggleBookmarkSearchMode}
          className={`relative h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ${
            isBookmarkSearchMode 
              ? "bg-primary/90 text-primary-foreground hover:bg-primary" 
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          <motion.div
            initial={false}
            animate={{ 
              rotate: isBookmarkSearchMode ? 0 : 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 0.4 }}
          >
            {isBookmarkSearchMode ? (
              <MessageCircle size={14} />
            ) : (
              <BookmarkPlus size={14} />
            )}
          </motion.div>
          <span>{isBookmarkSearchMode ? "Exit Search" : "Search Bookmarks"}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ChatHeader;
