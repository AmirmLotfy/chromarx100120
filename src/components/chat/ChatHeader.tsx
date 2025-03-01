
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChatHeaderProps {
  clearChat: () => void;
  messageCount: number;
}

const ChatHeader = ({ clearChat, messageCount }: ChatHeaderProps) => {
  const handleClearChat = () => {
    if (messageCount > 0) {
      clearChat();
      toast.success("Chat cleared successfully");
    } else {
      toast.info("No messages to clear");
    }
  };

  return (
    <div className="flex justify-between items-center p-2 border-b">
      <h2 className="text-sm font-medium hidden md:block">AI Assistant</h2>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClearChat}
        className="text-muted-foreground hover:text-foreground ml-auto"
        title="Clear conversation"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Clear Chat</span>
      </Button>
    </div>
  );
};

export default ChatHeader;
