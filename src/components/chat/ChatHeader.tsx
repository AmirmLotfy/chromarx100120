
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PenSquare, History, Trash2, BookmarkPlus, Search } from "lucide-react";
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
    <header className="border-b px-4 py-3 flex items-center justify-between bg-background/90 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleHistory}
          className="md:hidden"
          title="Chat history"
        >
          <History className="h-5 w-5" />
        </Button>
        
        <h2 className="text-lg font-semibold">
          {isBookmarkSearchMode ? "Bookmark Search" : "Chat"}
        </h2>
        {activeConversation && (
          <span className="text-sm text-muted-foreground ml-2 hidden md:inline-block">
            {activeConversation.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleBookmarkSearchMode}
          className={isBookmarkSearchMode ? "bg-secondary" : ""}
          title={isBookmarkSearchMode ? "Exit bookmark search" : "Search bookmarks"}
        >
          <Search className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onManageConversations}
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
              className="text-muted-foreground"
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
