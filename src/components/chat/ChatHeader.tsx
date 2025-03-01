
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PenSquare, History, Trash2, BookmarkPlus, Search, Menu } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Conversation } from "@/types/chat";
import { AIProgressIndicator } from "@/components/ui/ai-progress-indicator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ChatHeaderProps {
  clearChat: () => void;
  messageCount: number;
  onSaveConversation: (name: string, category: string) => void;
  activeConversation?: Conversation;
  onManageConversations: () => void;
  isBookmarkSearchMode?: boolean;
  toggleBookmarkSearchMode?: () => void;
  toggleHistory: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  clearChat,
  messageCount,
  onSaveConversation,
  activeConversation,
  onManageConversations,
  isBookmarkSearchMode = false,
  toggleBookmarkSearchMode = () => {},
  toggleHistory
}) => {
  const [conversationName, setConversationName] = useState(
    activeConversation?.name || ""
  );
  const [conversationCategory, setConversationCategory] = useState(
    activeConversation?.category || "General"
  );
  const [isSavingConversation, setIsSavingConversation] = useState(false);

  const handleSaveConversation = async () => {
    if (!conversationName.trim()) {
      toast.error("Please enter a conversation name");
      return;
    }

    setIsSavingConversation(true);
    try {
      await onSaveConversation(conversationName, conversationCategory);
      toast.success(`Conversation "${conversationName}" saved`);
    } catch (error) {
      console.error("Error saving conversation:", error);
      toast.error("Failed to save conversation");
    } finally {
      setIsSavingConversation(false);
    }
  };

  return (
    <header className="border-b px-4 py-3 flex items-center justify-between bg-background/60 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleHistory}
          className="text-primary/80 hover:text-primary hover:bg-primary/10"
          title="Chat history"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex flex-col">
          <h2 className="text-base font-semibold">
            {isBookmarkSearchMode ? "Bookmark Search" : "Chat"}
          </h2>
          {activeConversation && (
            <span className="text-xs text-muted-foreground truncate max-w-[150px] md:max-w-[200px]">
              {activeConversation.name}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={isBookmarkSearchMode ? "secondary" : "ghost"}
          size="sm"
          onClick={toggleBookmarkSearchMode}
          className="h-8 text-xs font-medium"
          title={isBookmarkSearchMode ? "Exit bookmark search" : "Search bookmarks"}
        >
          <Search className="h-3.5 w-3.5 mr-1.5" />
          Search
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onManageConversations}
          className="text-primary/80 hover:text-primary hover:bg-primary/10"
          title="Manage conversations"
        >
          <BookmarkPlus className="h-5 w-5" />
        </Button>

        {messageCount > 0 && (
          <>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary/80 hover:text-primary hover:bg-primary/10"
                  title="Save conversation"
                >
                  <PenSquare className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Save Conversation</DialogTitle>
                  <DialogDescription>
                    Give your conversation a name and category to save it for later.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="My Conversation"
                      className="col-span-3"
                      value={conversationName}
                      onChange={(e) => setConversationName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <Select 
                      value={conversationCategory}
                      onValueChange={setConversationCategory}
                    >
                      <SelectTrigger className="col-span-3">
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
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Cancel
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleSaveConversation} disabled={isSavingConversation}>
                      {isSavingConversation ? (
                        <AIProgressIndicator isLoading={true} variant="minimal" className="h-4 w-4 mr-2" />
                      ) : null}
                      Save
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
              title="Clear chat"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
};

export default ChatHeader;
