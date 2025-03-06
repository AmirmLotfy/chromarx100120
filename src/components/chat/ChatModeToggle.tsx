
import React from "react";
import { Sparkles, BookmarkPlus, Globe, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatModeToggleProps {
  mode: "chat" | "bookmark-search" | "web-search";
  changeMode: (mode: "chat" | "bookmark-search" | "web-search") => void;
  clearChat: () => void;
  hasMessages: boolean;
}

const ChatModeToggle: React.FC<ChatModeToggleProps> = ({
  mode,
  changeMode,
  clearChat,
  hasMessages,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-muted rounded-full p-0.5">
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-7 w-7 p-0 rounded-full text-xs",
            mode === "chat" ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/10"
          )}
          onClick={() => changeMode("chat")}
        >
          <Sparkles size={14} />
          <span className="sr-only">Chat</span>
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-7 w-7 p-0 rounded-full text-xs",
            mode === "bookmark-search" ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/10"
          )}
          onClick={() => changeMode("bookmark-search")}
        >
          <BookmarkPlus size={14} />
          <span className="sr-only">Bookmarks</span>
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-7 w-7 p-0 rounded-full text-xs",
            mode === "web-search" ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/10"
          )}
          onClick={() => changeMode("web-search")}
        >
          <Globe size={14} />
          <span className="sr-only">Web</span>
        </Button>
      </div>
      
      {hasMessages && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 rounded-full hover:bg-muted-foreground/10"
          onClick={clearChat}
        >
          <X size={14} />
          <span className="sr-only">Clear</span>
        </Button>
      )}
    </div>
  );
};

export default ChatModeToggle;
