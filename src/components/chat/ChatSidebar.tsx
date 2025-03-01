import React from "react";
import { Conversation, Message } from "@/types/chat";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Clock, MessageSquare, Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface ChatSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  chatHistory: Message[][];
  loadChatSession: (messages: Message[]) => void;
  activeConversation?: Conversation;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  setIsOpen,
  chatHistory,
  loadChatSession,
  activeConversation
}) => {
  const getConversationTitle = (messages: Message[]) => {
    if (!messages || messages.length === 0) return "Empty conversation";
    
    // Check if this is the active conversation
    if (activeConversation?.messages[0]?.id === messages[0]?.id) {
      return activeConversation.name;
    }
    
    // Otherwise, extract from first user message
    const firstUserMessage = messages.find(m => m.sender === "user");
    if (firstUserMessage) {
      const content = firstUserMessage.content;
      return content.length > 30 ? content.substring(0, 30) + "..." : content;
    }
    return "Conversation";
  };
  
  const getConversationTime = (messages: Message[]) => {
    if (!messages || messages.length === 0) return "";
    const timestamp = messages[0]?.timestamp;
    if (!timestamp) return "";
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getConversationCategory = (messages: Message[]) => {
    if (!messages || messages.length === 0) return null;
    
    // Check if this is a saved conversation with a category
    if (activeConversation?.messages[0]?.id === messages[0]?.id) {
      return activeConversation.category;
    }
    
    return null;
  };
  
  const isPinned = (messages: Message[]) => {
    if (!messages || messages.length === 0) return false;
    
    // Check if this conversation is pinned
    if (activeConversation?.messages[0]?.id === messages[0]?.id) {
      return activeConversation.pinned;
    }
    
    return false;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent 
        side="left" 
        className="p-0 border-r w-full sm:w-[300px] overflow-hidden"
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Chat History
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="flex-1 h-[calc(100vh-5rem)]">
            <div className="p-3">
              {chatHistory.length > 0 ? (
                <div className="space-y-3">
                  {chatHistory.map((chat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex flex-col p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-all"
                      onClick={() => {
                        loadChatSession(chat);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium text-sm truncate max-w-[180px]">
                            {getConversationTitle(chat)}
                          </p>
                          {isPinned(chat) && (
                            <Star className="h-3 w-3 text-yellow-400" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {getConversationTime(chat)}
                        </p>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs py-0">
                            {chat.length} msgs
                          </Badge>
                          {getConversationCategory(chat) && (
                            <Badge variant="secondary" className="text-xs py-0">
                              {getConversationCategory(chat)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
                  <p>No chat history yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatSidebar;
