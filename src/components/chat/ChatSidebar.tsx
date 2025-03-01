
import React from "react";
import { X, History, MessageCircle, Circle } from "lucide-react";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import { Conversation } from "@/types/chat";

interface ChatSidebarProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (isOpen: boolean) => void;
  chatHistory: Conversation[];
  loadChatSession: (messages: any[]) => void;
  clearChat: () => void;
  activeConversation: Conversation | undefined;
  isMobile: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isHistoryOpen,
  setIsHistoryOpen,
  chatHistory,
  loadChatSession,
  clearChat,
  activeConversation,
  isMobile
}) => {
  // If sidebar is not open, don't render anything
  if (!isHistoryOpen) return null;

  const handleClose = () => {
    console.log("Closing sidebar");
    setIsHistoryOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: isMobile ? -280 : -250 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isMobile ? -280 : -250 }}
      transition={{ duration: 0.2 }}
      className={`fixed inset-y-0 left-0 z-30 w-[70%] sm:w-[280px] bg-background border-r shadow-lg
                 ${isMobile ? 'h-full' : 'max-h-full'} flex flex-col overflow-hidden`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-base font-medium">Chat History</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={handleClose}
        >
          <X size={18} />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <History className="h-12 w-12 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No conversation history yet</p>
          </div>
        )}
        
        {chatHistory.map((conversation) => {
          const hasUnreadMessages = conversation.messages.some(msg => msg.sender === "assistant" && !msg.isRead);
          const lastMessageDate = new Date(conversation.updatedAt).toLocaleDateString();
          const isToday = lastMessageDate === new Date().toLocaleDateString();
          
          return (
            <div 
              key={conversation.id}
              onClick={() => {
                loadChatSession(conversation.messages);
                if (isMobile) setIsHistoryOpen(false);
              }}
              className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors relative
                        ${activeConversation?.id === conversation.id 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted'}`}
            >
              <div className="flex justify-between items-start">
                <div className="font-medium truncate text-sm flex-1">{conversation.name}</div>
                {hasUnreadMessages && (
                  <Circle className="h-2 w-2 fill-primary text-primary flex-shrink-0" />
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate mt-1">
                {conversation.messages[conversation.messages.length - 1]?.content.substring(0, 50)}
                {conversation.messages[conversation.messages.length - 1]?.content.length > 50 ? "..." : ""}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                <span>{isToday ? 'Today' : lastMessageDate}</span>
                <span className="text-[10px] opacity-70">
                  {new Date(conversation.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              
              {/* Message count badge */}
              <div className="absolute top-3 right-3 text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5 min-w-5 text-center">
                {conversation.messages.length}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="p-3 border-t">
        <Button 
          className="w-full text-sm h-9"
          variant="outline"
          onClick={() => {
            clearChat();
            if (isMobile) setIsHistoryOpen(false);
          }}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>
    </motion.div>
  );
};

export default ChatSidebar;
