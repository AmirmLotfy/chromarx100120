
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Archive, ChevronDown, History, Save, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Conversation } from "@/types/chat";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConversationCategory } from "@/types/chat";

interface ChatHeaderProps {
  clearChat: () => void;
  messageCount: number;
  onSaveConversation?: (name: string, category: string) => void;
  activeConversation?: Conversation;
  onManageConversations?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  clearChat,
  messageCount,
  onSaveConversation,
  activeConversation,
  onManageConversations
}) => {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [conversationName, setConversationName] = useState("");
  const [conversationCategory, setConversationCategory] = useState<ConversationCategory>("General");

  const handleSaveConversation = () => {
    if (onSaveConversation) {
      onSaveConversation(
        conversationName || "Untitled Conversation",
        conversationCategory
      );
      setIsSaveDialogOpen(false);
    }
  };

  const handleOpenSaveDialog = () => {
    setConversationName(activeConversation?.name || "");
    setConversationCategory((activeConversation?.category as ConversationCategory) || "General");
    setIsSaveDialogOpen(true);
  };

  return (
    <>
      <div className="p-3 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">
            {activeConversation?.name || "Chat with AI"}
          </h3>
          {activeConversation?.category && (
            <>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs bg-secondary rounded-full px-2 py-0.5">
                {activeConversation.category}
              </span>
            </>
          )}
        </div>

        <div className="flex gap-1">
          <TooltipProvider>
            {messageCount > 0 && onSaveConversation && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleOpenSaveDialog}>
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save conversation</TooltipContent>
              </Tooltip>
            )}

            {onManageConversations && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onManageConversations}>
                    <History className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Manage conversations</TooltipContent>
              </Tooltip>
            )}

            {messageCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={clearChat}>
                    <Archive className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear chat</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Conversation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="conversation-name">Name</Label>
              <Input
                id="conversation-name"
                value={conversationName}
                onChange={(e) => setConversationName(e.target.value)}
                placeholder="Enter a name for this conversation"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="conversation-category">Category</Label>
              <Select
                value={conversationCategory}
                onValueChange={(value) => setConversationCategory(value as ConversationCategory)}
              >
                <SelectTrigger id="conversation-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Bookmarks">Bookmarks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConversation}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatHeader;
