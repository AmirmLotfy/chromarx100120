
import React from "react";
import { Conversation } from "@/types/chat";
import ChatModeToggle from "./ChatModeToggle";

interface ChatHeaderProps {
  activeConversation: Conversation | undefined;
  mode: "chat" | "bookmark-search" | "web-search";
  changeMode: (mode: "chat" | "bookmark-search" | "web-search") => void;
  clearChat: () => void;
  messagesCount: number;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeConversation,
  mode,
  changeMode,
  clearChat,
  messagesCount,
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-background/95 backdrop-blur-sm border-b z-10">
      <div className="flex items-center gap-2">
        {activeConversation?.name ? (
          <span className="text-sm font-medium truncate max-w-[200px]">{activeConversation.name}</span>
        ) : (
          <span className="text-sm font-medium">AI Assistant</span>
        )}
      </div>
      
      <ChatModeToggle 
        mode={mode} 
        changeMode={changeMode} 
        clearChat={clearChat} 
        hasMessages={messagesCount > 1}
      />
    </div>
  );
};

export default ChatHeader;
