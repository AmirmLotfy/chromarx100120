
import React, { useState } from "react";
import { X, History, MessageCircle, Circle, Pin, PinOff, Archive, Trash2, RefreshCw, Filter } from "lucide-react";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import { Conversation, ConversationCategory } from "@/types/chat";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatSidebarProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (isOpen: boolean) => void;
  chatHistory: Conversation[];
  archivedConversations: Conversation[];
  loadChatSession: (conversation: Conversation) => void;
  clearChat: () => void;
  activeConversation: Conversation | undefined;
  isMobile: boolean;
  archiveConversation: (conversationId: string) => Promise<void>;
  restoreConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  updateConversationCategory: (conversationId: string, category: ConversationCategory) => Promise<void>;
  togglePinned: (conversationId: string) => Promise<void>;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isHistoryOpen,
  setIsHistoryOpen,
  chatHistory,
  archivedConversations,
  loadChatSession,
  clearChat,
  activeConversation,
  isMobile,
  archiveConversation,
  restoreConversation,
  deleteConversation,
  updateConversationCategory,
  togglePinned
}) => {
  // If sidebar is not open, don't render anything
  if (!isHistoryOpen) return null;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("active");
  const [categoryFilter, setCategoryFilter] = useState<ConversationCategory | "All">("All");
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const handleClose = () => {
    console.log("Closing sidebar");
    setIsHistoryOpen(false);
  };

  // Filter conversations based on search query and category
  const filterConversations = (conversations: Conversation[]) => {
    return conversations.filter(conversation => {
      const matchesSearch = conversation.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "All" || conversation.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  // Get pinned conversations first, then the rest
  const sortedConversations = (conversations: Conversation[]) => {
    const filtered = filterConversations(conversations);
    return [
      ...filtered.filter(c => c.pinned),
      ...filtered.filter(c => !c.pinned)
    ];
  };

  // Active and archived conversations after filtering
  const filteredActive = sortedConversations(chatHistory);
  const filteredArchived = filterConversations(archivedConversations);

  return (
    <motion.div 
      initial={{ opacity: 0, x: isMobile ? -280 : -250 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isMobile ? -280 : -250 }}
      transition={{ duration: 0.2 }}
      className={`fixed inset-y-0 left-0 z-30 w-[85%] sm:w-[320px] bg-background border-r shadow-lg
                 ${isMobile ? 'h-full' : 'max-h-full'} flex flex-col overflow-hidden`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-base font-medium">Chat History</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={handleClose}
        >
          <X size={18} />
        </Button>
      </div>
      
      <div className="p-3 border-b">
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-4 w-4 mr-2" />
              {categoryFilter === "All" ? "All Categories" : categoryFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={categoryFilter} onValueChange={(value: string) => setCategoryFilter(value as ConversationCategory | "All")}>
              <DropdownMenuRadioItem value="All">All Categories</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="General">General</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Work">Work</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Research">Research</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Personal">Personal</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Bookmarks">Bookmarks</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="px-3 py-2 justify-start border-b">
          <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
          <TabsTrigger value="archived" className="flex-1">Archived</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="flex-1 overflow-y-auto p-2">
          {filteredActive.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <History className="h-12 w-12 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery || categoryFilter !== "All" 
                  ? "No matching conversations found" 
                  : "No conversation history yet"}
              </p>
            </div>
          )}
          
          {filteredActive.map((conversation) => {
            const hasUnreadMessages = conversation.messages.some(msg => msg.sender === "assistant" && !msg.isRead);
            const lastMessageDate = new Date(conversation.updatedAt).toLocaleDateString();
            const isToday = lastMessageDate === new Date().toLocaleDateString();
            
            return (
              <div 
                key={conversation.id}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors relative group
                          ${conversation.pinned ? 'bg-muted/60 border border-primary/20' : ''}
                          ${activeConversation?.id === conversation.id 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-muted'}`}
              >
                <div 
                  className="flex-1"
                  onClick={() => {
                    loadChatSession(conversation);
                    if (isMobile) setIsHistoryOpen(false);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium truncate text-sm flex-1 pr-6">
                      {conversation.name}
                    </div>
                    {conversation.pinned && (
                      <Pin className="h-3 w-3 text-primary absolute top-3 right-10" />
                    )}
                    {hasUnreadMessages && (
                      <Circle className="h-2 w-2 fill-primary text-primary flex-shrink-0 absolute top-3 right-3" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {conversation.messages[conversation.messages.length - 1]?.content.substring(0, 50)}
                    {conversation.messages[conversation.messages.length - 1]?.content.length > 50 ? "..." : ""}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                    <span>{isToday ? 'Today' : lastMessageDate}</span>
                    <span className="text-[10px] opacity-70">
                      {new Date(conversation.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="1"/>
                            <circle cx="12" cy="5" r="1"/>
                            <circle cx="12" cy="19" r="1"/>
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => togglePinned(conversation.id)}>
                          {conversation.pinned ? (
                            <>
                              <PinOff className="h-4 w-4 mr-2" />
                              Unpin conversation
                            </>
                          ) : (
                            <>
                              <Pin className="h-4 w-4 mr-2" />
                              Pin conversation
                            </>
                          )}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Filter className="h-4 w-4 mr-2" />
                            Move to category
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => updateConversationCategory(conversation.id, "General")}>
                              General
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateConversationCategory(conversation.id, "Work")}>
                              Work
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateConversationCategory(conversation.id, "Research")}>
                              Research
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateConversationCategory(conversation.id, "Personal")}>
                              Personal
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateConversationCategory(conversation.id, "Bookmarks")}>
                              Bookmarks
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => archiveConversation(conversation.id)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive conversation
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setConversationToDelete(conversation.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete conversation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Category badge */}
                <div className="absolute bottom-2 right-2 text-xs bg-secondary/60 text-secondary-foreground rounded-full px-1.5 py-0.5 text-center">
                  {conversation.category}
                </div>
              </div>
            );
          })}
        </TabsContent>
        
        <TabsContent value="archived" className="flex-1 overflow-y-auto p-2">
          {filteredArchived.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <Archive className="h-12 w-12 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery || categoryFilter !== "All" 
                  ? "No matching archived conversations found" 
                  : "No archived conversations yet"}
              </p>
            </div>
          )}
          
          {filteredArchived.map((conversation) => (
            <div 
              key={conversation.id}
              className="p-3 rounded-lg mb-2 cursor-pointer transition-colors relative group bg-muted/40 hover:bg-muted"
            >
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div className="font-medium truncate text-sm flex-1 pr-6 text-muted-foreground">
                    {conversation.name}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground truncate mt-1">
                  {conversation.messages[conversation.messages.length - 1]?.content.substring(0, 50)}
                  {conversation.messages[conversation.messages.length - 1]?.content.length > 50 ? "..." : ""}
                </div>
                <div className="text-xs text-muted-foreground/70 mt-1">
                  Archived on {new Date(conversation.updatedAt).toLocaleDateString()}
                </div>
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="14" 
                          height="14" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="1"/>
                          <circle cx="12" cy="5" r="1"/>
                          <circle cx="12" cy="19" r="1"/>
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => restoreConversation(conversation.id)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Restore conversation
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setConversationToDelete(conversation.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete permanently
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Category badge */}
              <div className="absolute bottom-2 right-2 text-xs bg-secondary/40 text-secondary-foreground/70 rounded-full px-1.5 py-0.5 text-center">
                {conversation.category}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
      
      <div className="p-3 border-t">
        <Button 
          className="w-full text-sm h-9"
          variant="outline"
          onClick={() => {
            clearChat();
            if (isMobile) setIsHistoryOpen(false);
          }}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!conversationToDelete} onOpenChange={() => setConversationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTab === "archived" 
                ? "This action cannot be undone. This will permanently delete the conversation."
                : "This conversation will be moved to the archive. You can restore it later or delete it permanently."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (conversationToDelete) {
                  deleteConversation(conversationToDelete);
                  setConversationToDelete(null);
                }
              }}
            >
              {selectedTab === "archived" ? "Delete permanently" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default ChatSidebar;
