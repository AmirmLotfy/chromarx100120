
import React from "react";
import { Conversation, ConversationCategory } from "@/types/chat";
import { Button } from "../ui/button";
import { Trash2, MessageCircle, Star, FolderOpen } from "lucide-react";

interface ChatHistoryProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversationId: string) => void;
  onPinConversation: (conversationId: string) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onPinConversation
}) => {
  // Group conversations by category
  const groupedConversations = conversations.reduce<Record<ConversationCategory, Conversation[]>>((acc, conversation) => {
    const category = conversation.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(conversation);
    return acc;
  }, {} as Record<ConversationCategory, Conversation[]>);

  // Get all categories that have conversations
  const categories = Object.keys(groupedConversations) as ConversationCategory[];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b">
        <h2 className="text-lg font-medium">Chat History</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
            <MessageCircle className="h-12 w-12 text-muted-foreground/40 mb-2" />
            <p className="text-sm">No conversation history yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                  <FolderOpen className="h-4 w-4 mr-1" />
                  {category}
                </h3>
                
                {groupedConversations[category].map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-2 rounded-md cursor-pointer transition-colors ${
                      conversation.id === activeConversationId
                        ? "bg-secondary"
                        : "hover:bg-secondary/50"
                    }`}
                    onClick={() => onSelectConversation(conversation)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="truncate flex-1">
                        <p className="text-sm font-medium truncate">{conversation.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conversation.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPinConversation(conversation.id);
                          }}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              conversation.pinned ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conversation.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            onSelectConversation({
              id: "",
              name: "New Conversation",
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              category: "General"
            });
          }}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>
    </div>
  );
};

export default ChatHistory;
