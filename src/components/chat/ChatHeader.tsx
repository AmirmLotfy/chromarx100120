
import React from "react";
import { Menu, MessageCircle, Search } from "lucide-react";
import { motion } from "framer-motion";

interface ChatHeaderProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (isOpen: boolean) => void;
  activeConversation: any | undefined;
  messagesCount: number;
  clearChat: () => void;
  isBookmarkSearchMode: boolean;
  toggleBookmarkSearchMode: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isHistoryOpen,
  setIsHistoryOpen,
  activeConversation,
  messagesCount,
  isBookmarkSearchMode,
  toggleBookmarkSearchMode,
}) => {
  const handleToggleSidebar = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  return (
    <motion.div 
      className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur-sm"
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
          <Menu size={18} />
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

      <motion.button
        initial={false}
        whileTap={{ scale: 0.95 }}
        onClick={toggleBookmarkSearchMode}
        className={`relative h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ${
          isBookmarkSearchMode 
            ? "bg-primary text-primary-foreground" 
            : "bg-accent text-foreground hover:bg-accent/80"
        }`}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isBookmarkSearchMode ? 0 : 360 }}
          transition={{ duration: 0.3 }}
        >
          {isBookmarkSearchMode ? <MessageCircle size={14} /> : <Search size={14} />}
        </motion.div>
        <span>{isBookmarkSearchMode ? "Chat" : "Search"}</span>
      </motion.button>
    </motion.div>
  );
};

export default ChatHeader;
