
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, MessageSquare } from "lucide-react";

export interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Array<{
    id: string;
    title: string;
    lastMessage?: string;
    createdAt: string;
    category?: string;
  }>;
  loadConversation: (conversationId: string) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  isOpen,
  onClose,
  conversations,
  loadConversation
}) => {
  const handleSelectConversation = (conversationId: string) => {
    loadConversation(conversationId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conversation History</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No conversation history found
              </div>
            ) : (
              conversations.map(conversation => (
                <div
                  key={conversation.id}
                  className="p-3 border rounded-md hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">{conversation.title || 'Untitled Conversation'}</h3>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add delete functionality
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {conversation.lastMessage}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(conversation.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ChatHistory;
