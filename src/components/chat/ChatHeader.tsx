
import React, { useState } from "react";
import { Conversation } from "@/types/chat";
import { Trash2, Save, Bookmark, History, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChatHeaderProps {
  clearChat: () => void;
  messageCount: number;
  onSaveConversation: (name: string, category: string) => void;
  activeConversation?: Conversation;
  onManageConversations: () => void;
  isBookmarkSearchMode: boolean;
  toggleBookmarkSearchMode: () => void;
  toggleHistory: () => void;
  isHistoryOpen: boolean;
  isMobile: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  clearChat,
  messageCount,
  onSaveConversation,
  activeConversation,
  onManageConversations,
  isBookmarkSearchMode,
  toggleBookmarkSearchMode,
  toggleHistory,
  isHistoryOpen,
  isMobile
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [conversationName, setConversationName] = useState(
    activeConversation?.name || ""
  );
  const [conversationCategory, setConversationCategory] = useState(
    activeConversation?.category || "General"
  );

  const handleSave = () => {
    onSaveConversation(
      conversationName || `Conversation ${new Date().toLocaleString()}`,
      conversationCategory || "General"
    );
    setIsDialogOpen(false);
  };

  return (
    <div className="flex items-center justify-between p-3 border-b border-primary/10 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleHistory}
            className="mr-2"
            aria-label={isHistoryOpen ? "Close history" : "Open history"}
          >
            {isHistoryOpen ? <X className="h-4 w-4" /> : <History className="h-4 w-4" />}
          </Button>
        )}
        <h2 className="text-lg font-semibold">
          {isBookmarkSearchMode 
            ? "Bookmark Search" 
            : activeConversation?.name || "New Conversation"}
        </h2>
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleBookmarkSearchMode}
          className={isBookmarkSearchMode ? "bg-primary/10 text-primary" : ""}
          aria-label={isBookmarkSearchMode ? "Exit search mode" : "Search bookmarks"}
        >
          <Search className="h-4 w-4" />
        </Button>

        {messageCount > 0 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDialogOpen(true)}
              aria-label="Save conversation"
            >
              <Save className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              aria-label="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Conversation</DialogTitle>
            <DialogDescription>
              Give your conversation a name and category to save it for later reference.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="conversation-name" className="text-right">
                Name
              </Label>
              <Input
                id="conversation-name"
                value={conversationName}
                onChange={(e) => setConversationName(e.target.value)}
                placeholder="My conversation"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="conversation-category" className="text-right">
                Category
              </Label>
              <Input
                id="conversation-category"
                value={conversationCategory}
                onChange={(e) => setConversationCategory(e.target.value)}
                placeholder="General"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatHeader;
