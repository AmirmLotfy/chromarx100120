
import React from "react";
import { Menu, MessageCircle, Search, X } from "lucide-react";
import { Button } from "../ui/button";

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
    <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-violet-500/10 to-indigo-500/10">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={handleToggleSidebar}
          aria-label={isHistoryOpen ? "Close menu" : "Open menu"}
        >
          {isHistoryOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
        
        <div className="flex flex-col">
          <h1 className="text-lg font-medium">
            {activeConversation?.name || "New Chat"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {messagesCount === 0 
              ? "Start a new conversation" 
              : `${messagesCount} messages`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 text-xs gap-1"
          onClick={toggleBookmarkSearchMode}
        >
          {isBookmarkSearchMode ? <MessageCircle size={16} /> : <Search size={16} />}
          {isBookmarkSearchMode ? "Chat Mode" : "Search Mode"}
        </Button>
        
        {!isHistoryOpen && messagesCount > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clearChat}
            aria-label="Clear chat"
          >
            <X size={18} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
