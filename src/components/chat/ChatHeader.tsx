
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
      className="flex items-center justify-between px-3 py-2 border-b bg-background/95 backdrop-blur-sm z-10"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-1.5">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleSidebar}
          className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center"
          aria-label={isHistoryOpen ? "Close menu" : "Open menu"}
        >
          {isHistoryOpen ? 
            <ChevronLeft size={16} className="text-primary" /> : 
            <Menu size={16} />
          }
        </motion.button>
        
        <div className="flex flex-col">
          <h1 className="text-xs font-medium flex items-center gap-1">
            {activeConversation?.name || "New Chat"}
            {activeConversation?.pinned && (
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </h1>
          <p className="text-[10px] text-muted-foreground">
            {messagesCount === 0 
              ? "Start a conversation" 
              : `${messagesCount} messages${activeConversation?.category ? ` • ${activeConversation.category}` : ''}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {!isBookmarkSearchMode && activeConversation && (
          <Button
            onClick={clearChat}
            size="sm"
            variant="ghost"
            className="h-7 text-[10px]"
          >
            New Chat
          </Button>
        )}

        <motion.button
          initial={false}
          whileTap={{ scale: 0.95 }}
          onClick={toggleBookmarkSearchMode}
          className={`relative h-7 px-2 rounded-full text-[10px] font-medium flex items-center gap-1 transition-colors ${
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
              <MessageCircle size={12} />
            ) : (
              <BookmarkPlus size={12} />
            )}
          </motion.div>
          <span>{isBookmarkSearchMode ? "Exit Search" : "Search Bookmarks"}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ChatHeader;
