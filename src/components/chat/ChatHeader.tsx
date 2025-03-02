
import React from "react";
import { Menu, MessageCircle, Search, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
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
  clearChat,
  isBookmarkSearchMode,
  toggleBookmarkSearchMode,
}) => {
  const handleToggleSidebar = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  return (
    <motion.div 
      className="flex items-center justify-between px-4 py-4 border-b bg-background/90 backdrop-blur-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleSidebar}
          className="h-10 w-10 rounded-full hover:bg-accent flex items-center justify-center"
          aria-label={isHistoryOpen ? "Close menu" : "Open menu"}
        >
          <Menu size={20} />
        </motion.button>
        
        <div className="flex flex-col">
          <h1 className="text-base font-semibold flex items-center gap-1.5">
            {activeConversation?.name || "New Chat"}
            {activeConversation?.pinned && (
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </h1>
          <p className="text-xs text-muted-foreground">
            {messagesCount === 0 
              ? "Start a new conversation" 
              : `${messagesCount} messages${activeConversation?.category ? ` • ${activeConversation.category}` : ''}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Clear chat button */}
        {messagesCount > 0 && !isBookmarkSearchMode && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearChat}
            className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label="Clear conversation"
          >
            <Trash2 size={16} />
          </motion.button>
        )}
        
        <motion.button
          initial={false}
          whileTap={{ scale: 0.95 }}
          onClick={toggleBookmarkSearchMode}
          className={`relative h-9 px-4 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${
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
            {isBookmarkSearchMode ? <MessageCircle size={16} /> : <Search size={16} />}
          </motion.div>
          <span>{isBookmarkSearchMode ? "Chat" : "Search"}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ChatHeader;
