
import React from "react";
import { Conversation, Message } from "@/types/chat";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Clock, MessageSquare, Star, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [searchTerm, setSearchTerm] = React.useState("");
  
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

  const filteredHistory = chatHistory.filter(chat => {
    if (!searchTerm) return true;
    
    const title = getConversationTitle(chat);
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent 
        side="left" 
        className="p-0 border-r w-full sm:w-[320px] overflow-hidden bg-background/80 backdrop-blur-sm"
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-primary" />
              Chat History
            </SheetTitle>
            <div className="mt-2 relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </SheetHeader>
          
          <ScrollArea className="flex-1 h-[calc(100vh-10rem)]">
            <div className="p-3">
              {filteredHistory.length > 0 ? (
                <div className="space-y-3">
                  {filteredHistory.map((chat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={`flex flex-col p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        activeConversation?.messages[0]?.id === chat[0]?.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-accent/50 border border-border/50"
                      }`}
                      onClick={() => {
                        loadChatSession(chat);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className={`h-4 w-4 ${
                            activeConversation?.messages[0]?.id === chat[0]?.id
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`} />
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
                  {searchTerm ? (
                    <>
                      <Search className="h-10 w-10 mb-2 opacity-50" />
                      <p>No conversations found</p>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
                      <p>No chat history yet</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t mt-auto">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setIsOpen(false)}
            >
              Close Sidebar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatSidebar;
