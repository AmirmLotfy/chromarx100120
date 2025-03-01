import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Message, Conversation } from "@/types/chat";
import { Clock, History, MessageSquare, Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ChatHistoryProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  chatHistory: Message[][];
  loadChatSession: (messages: Message[]) => void;
  activeConversation?: Conversation;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  isHistoryOpen,
  setIsHistoryOpen,
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
    <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-16"
          aria-label="Chat history"
        >
          <History className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Chat History
          </SheetTitle>
        </SheetHeader>
        
        <div className="py-4">
          <ScrollArea className="h-[calc(100vh-7rem)]">
            {chatHistory.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  {chatHistory.map((chat, index) => (
                    <div
                      key={index}
                      className="flex flex-col p-3 border rounded-md hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => {
                        loadChatSession(chat);
                        setIsHistoryOpen(false);
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
                        <p className="text-xs text-muted-foreground">
                          {getConversationTime(chat)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-muted-foreground">
                            {chat.length} messages
                          </p>
                          {getConversationCategory(chat) && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {getConversationCategory(chat)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <History className="h-10 w-10 mb-2 opacity-50" />
                <p>No chat history yet</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatHistory;
