
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ConversationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Array<{
    id: string;
    title: string;
    category?: string;
  }>;
  updateConversation: (conversationId: string, data: { title?: string; category?: string }) => void;
}

const ConversationManager: React.FC<ConversationManagerProps> = ({
  isOpen,
  onClose,
  conversations,
  updateConversation
}) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");

  const handleSelectConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setSelectedConversation(conversationId);
      setTitle(conversation.title || "");
      setCategory(conversation.category || "");
    }
  };

  const handleSave = () => {
    if (selectedConversation) {
      updateConversation(selectedConversation, {
        title,
        category
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Conversations</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="conversation">Select Conversation</Label>
            <Select 
              value={selectedConversation || ""} 
              onValueChange={handleSelectConversation}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a conversation" />
              </SelectTrigger>
              <SelectContent>
                {conversations.map(conversation => (
                  <SelectItem key={conversation.id} value={conversation.id}>
                    {conversation.title || "Untitled Conversation"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedConversation && (
            <>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Conversation title"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationManager;
