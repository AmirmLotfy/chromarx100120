
import { useState } from "react";
import { motion } from "framer-motion";
import { Archive, ArchiveRestore, MoreVertical, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Conversation, ConversationCategory } from "@/types/chat";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface ChatSidebarProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  chatHistory: Conversation[];
  loadChatSession: (conversation: Conversation) => void;
  clearChat: () => void;
  activeConversation?: Conversation;
  isMobile: boolean;
  archivedConversations: Conversation[];
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
  archiveConversation: (id: string) => Promise<void>;
  restoreConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversationCategory: (id: string, category: ConversationCategory) => Promise<void>;
  togglePinned: (id: string) => Promise<void>;
}

const ChatSidebar = ({
  isHistoryOpen,
  setIsHistoryOpen,
  chatHistory,
  loadChatSession,
  clearChat,
  activeConversation,
  isMobile,
  archivedConversations,
  showArchived,
  setShowArchived,
  archiveConversation,
  restoreConversation,
  deleteConversation,
  updateConversationCategory,
  togglePinned
}: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | ConversationCategory>("all");
  
  // Filter conversations based on search and category
  const filteredConversations = (showArchived ? archivedConversations : chatHistory).filter(
    (conversation) => {
      const matchesSearch = conversation.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory = 
        selectedCategory === "all" || conversation.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }
  );

  // Get pinned conversations at the top
  const pinnedConversations = filteredConversations.filter(c => c.pinned);
  const unpinnedConversations = filteredConversations.filter(c => !c.pinned);
  const sortedConversations = [...pinnedConversations, ...unpinnedConversations];

  // Get unique categories from conversations
  const categories = Array.from(
    new Set([...chatHistory, ...archivedConversations].map((c) => c.category))
  );

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-background border-r w-80 h-full flex flex-col",
        isMobile ? "absolute inset-y-0 left-0 z-30" : "relative"
      )}
    >
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold text-lg">Chat History</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              clearChat();
              if (isMobile) setIsHistoryOpen(false);
            }}
            size="sm"
            variant="ghost"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Chat
          </Button>
        </div>
      </div>

      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="conversations" className="flex-1 flex flex-col">
        <div className="border-b px-2">
          <TabsList className="w-full">
            <TabsTrigger 
              value="conversations" 
              className="flex-1"
              onClick={() => setShowArchived(false)}
            >
              Conversations
            </TabsTrigger>
            <TabsTrigger 
              value="archived" 
              className="flex-1"
              onClick={() => setShowArchived(true)}
            >
              Archived
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="conversations" className="flex-1">
          <div className="flex gap-1 p-2 overflow-x-auto border-b">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {sortedConversations.length > 0 ? (
                sortedConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={activeConversation?.id === conversation.id}
                    onClick={() => {
                      loadChatSession(conversation);
                      if (isMobile) setIsHistoryOpen(false);
                    }}
                    onArchive={() => archiveConversation(conversation.id)}
                    onDelete={() => deleteConversation(conversation.id)}
                    onCategoryChange={(category) => updateConversationCategory(conversation.id, category)}
                    onTogglePinned={() => togglePinned(conversation.id)}
                    isArchived={false}
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {searchQuery
                    ? "No conversations match your search"
                    : "No conversations yet"}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="archived" className="flex-1">
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {sortedConversations.length > 0 ? (
                sortedConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={activeConversation?.id === conversation.id}
                    onClick={() => {
                      loadChatSession(conversation);
                      if (isMobile) setIsHistoryOpen(false);
                    }}
                    onRestore={() => restoreConversation(conversation.id)}
                    onDelete={() => deleteConversation(conversation.id)}
                    isArchived={true}
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {searchQuery
                    ? "No archived conversations match your search"
                    : "No archived conversations"}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete: () => void;
  onCategoryChange?: (category: ConversationCategory) => void;
  onTogglePinned?: () => void;
  isArchived: boolean;
}

const ConversationItem = ({
  conversation,
  isActive,
  onClick,
  onArchive,
  onRestore,
  onDelete,
  onCategoryChange,
  onTogglePinned,
  isArchived
}: ConversationItemProps) => {
  // Generate a readable date string
  const date = new Date(conversation.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  // Get the categories for the dropdown
  const categories: ConversationCategory[] = [
    "General",
    "Work",
    "Research",
    "Personal",
    "Bookmarks"
  ];

  return (
    <div
      className={cn(
        "p-2 rounded-md hover:bg-accent group flex justify-between items-start cursor-pointer",
        isActive && "bg-accent"
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{conversation.name}</h3>
          {conversation.pinned && !isArchived && (
            <div className="h-1 w-1 rounded-full bg-primary" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span>{date}</span>
          <span>•</span>
          <span>{conversation.category}</span>
          <span>•</span>
          <span>{conversation.messages.length} messages</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isArchived && (
            <>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                if (onTogglePinned) onTogglePinned();
              }}>
                {conversation.pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (onArchive) onArchive();
                }}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {onCategoryChange && (
                <>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCategoryChange(category);
                      }}
                    >
                      Move to {category}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
            </>
          )}
          
          {isArchived && (
            <>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRestore) onRestore();
                }}
              >
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Restore
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ChatSidebar;
