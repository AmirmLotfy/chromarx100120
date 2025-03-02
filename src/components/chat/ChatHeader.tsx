
import React from "react";
import { Menu, MessageCircle, Search, X, Info } from "lucide-react";
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
    console.log("Toggle history sidebar", !isHistoryOpen);
    setIsHistoryOpen(!isHistoryOpen);
  };

  return (
    <motion.div 
      className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-secondary/5 backdrop-blur-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full bg-background/80 shadow-sm"
          onClick={handleToggleSidebar}
          aria-label={isHistoryOpen ? "Close menu" : "Open menu"}
        >
          {isHistoryOpen ? <X size={18} /> : <Menu size={18} />}
        </Button>
        
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

      <div className="flex items-center gap-1.5">
        <motion.button
          initial={false}
          whileTap={{ scale: 0.94 }}
          onClick={toggleBookmarkSearchMode}
          className={`relative h-9 px-3 rounded-full text-sm font-medium flex items-center gap-1.5 ${
            isBookmarkSearchMode 
              ? "bg-secondary text-secondary-foreground" 
              : "bg-background/80 text-foreground shadow-sm border"
          }`}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isBookmarkSearchMode ? 0 : 360 }}
            transition={{ duration: 0.3 }}
          >
            {isBookmarkSearchMode ? <MessageCircle size={16} /> : <Search size={16} />}
          </motion.div>
          <span className="text-xs">{isBookmarkSearchMode ? "Chat" : "Search"}</span>
        </motion.button>
        
        {!isHistoryOpen && messagesCount > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-background/80 shadow-sm"
            onClick={clearChat}
            aria-label="Clear chat"
          >
            <X size={18} />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-background/80 shadow-sm"
          aria-label="Information"
        >
          <Info size={18} />
        </Button>
      </div>
    </motion.div>
  );
};

export default ChatHeader;
