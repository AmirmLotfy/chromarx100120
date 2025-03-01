
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Conversation, ConversationCategory, Message } from "@/types/chat";
import { Folder, Star, StarOff, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface ConversationManagerProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  conversations: Message[][];
  activeConversation?: Conversation;
  onUpdateConversation: (conversation: Conversation) => void;
  onLoadConversation: (messages: Message[]) => void;
}

const ConversationManager: React.FC<ConversationManagerProps> = ({
  isOpen,
  setIsOpen,
  conversations,
  activeConversation,
  onUpdateConversation,
  onLoadConversation,
}) => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(activeConversation || null);
  const [editName, setEditName] = useState<string>("");
  const [editCategory, setEditCategory] = useState<ConversationCategory>("General");

  // When dialog opens, set the selected conversation
  React.useEffect(() => {
    if (isOpen && activeConversation) {
      setSelectedConversation(activeConversation);
      setEditName(activeConversation.name);
      setEditCategory(activeConversation.category as ConversationCategory || "General");
    }
  }, [isOpen, activeConversation]);

  const handleSelectConversation = (convoMessages: Message[]) => {
    // Find if this message array corresponds to a saved conversation
    // For now just use the first message ID as a simple way to identify
    const firstMsgId = convoMessages[0]?.id;
    const existingConvo = conversations.find(msgs => msgs[0]?.id === firstMsgId);
    
    if (existingConvo) {
      // If it's a saved conversation, load its details
      const foundConvo = {
        id: firstMsgId,
        name: "Untitled Conversation",
        messages: convoMessages,
        createdAt: convoMessages[0]?.timestamp || new Date(),
        updatedAt: convoMessages[convoMessages.length - 1]?.timestamp || new Date(),
        category: "General" as ConversationCategory
      };
      
      setSelectedConversation(foundConvo);
      setEditName(foundConvo.name);
      setEditCategory(foundConvo.category);
    }
  };

  const handleSave = () => {
    if (selectedConversation) {
      const updatedConvo: Conversation = {
        ...selectedConversation,
        name: editName || "Untitled Conversation",
        category: editCategory,
        updatedAt: new Date()
      };
      
      onUpdateConversation(updatedConvo);
      setIsOpen(false);
    }
  };

  const handleLoadConversation = () => {
    if (selectedConversation) {
      onLoadConversation(selectedConversation.messages);
      setIsOpen(false);
    }
  };

  const getConversationPreview = (messages: Message[]) => {
    if (!messages || messages.length === 0) return "Empty conversation";
    
    // Get the first user message
    const firstUserMsg = messages.find(m => m.sender === "user");
    return firstUserMsg ? 
      (firstUserMsg.content.length > 40 ? 
        firstUserMsg.content.substring(0, 40) + "..." : 
        firstUserMsg.content) 
      : "No user message";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Conversations</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="col-span-1 border rounded-md p-2">
            <Label className="block mb-2 text-sm font-medium">Conversations</Label>
            <ScrollArea className="h-[300px] pr-2">
              <div className="space-y-2">
                {conversations.map((convo, idx) => (
                  <div 
                    key={convo[0]?.id || idx}
                    className={`p-2 border rounded-md cursor-pointer hover:bg-secondary transition-colors 
                      ${selectedConversation && convo[0]?.id === selectedConversation.messages[0]?.id ? 'bg-secondary' : ''}`}
                    onClick={() => handleSelectConversation(convo)}
                  >
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getConversationPreview(convo)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {convo[0]?.timestamp ? format(new Date(convo[0].timestamp), 'MMM d, yyyy') : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <div className="col-span-1 border rounded-md p-2">
            <Label className="block mb-2 text-sm font-medium">Conversation Details</Label>
            {selectedConversation ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="convo-name">Name</Label>
                  <Input 
                    id="convo-name"
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter conversation name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="convo-category">Category</Label>
                  <Select 
                    value={editCategory} 
                    onValueChange={(value) => setEditCategory(value as ConversationCategory)}
                  >
                    <SelectTrigger id="convo-category">
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
                
                <div className="flex justify-between">
                  <div className="text-xs text-muted-foreground">
                    <p>Created: {format(new Date(selectedConversation.createdAt), 'MMM d, yyyy')}</p>
                    <p>Messages: {selectedConversation.messages.length}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      const updatedConvo = {
                        ...selectedConversation,
                        pinned: !selectedConversation.pinned
                      };
                      setSelectedConversation(updatedConvo);
                    }}
                  >
                    {selectedConversation.pinned ? 
                      <Star className="h-4 w-4 text-yellow-400" /> : 
                      <StarOff className="h-4 w-4 text-muted-foreground" />
                    }
                  </Button>
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button 
                    variant="secondary" 
                    className="flex-1"
                    onClick={handleLoadConversation}
                  >
                    Load
                  </Button>
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Folder className="h-12 w-12 mb-2" />
                <p>Select a conversation</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationManager;
