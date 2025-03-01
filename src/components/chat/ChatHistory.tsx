
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Message } from "@/types/chat";

interface ChatHistoryProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (isOpen: boolean) => void;
  chatHistory: Message[][];
  loadChatSession: (session: Message[]) => void;
}

const ChatHistory = ({ 
  isHistoryOpen, 
  setIsHistoryOpen, 
  chatHistory, 
  loadChatSession 
}: ChatHistoryProps) => {
  return (
    <Collapsible
      open={isHistoryOpen}
      onOpenChange={setIsHistoryOpen}
      className="border-t"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center justify-between p-2 hover:bg-accent"
        >
          Recent Chat History
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
            isHistoryOpen ? "transform rotate-180" : ""
          }`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-2 space-y-2 max-h-[30vh] overflow-y-auto">
        {chatHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No chat history available
          </p>
        ) : (
          chatHistory.map((session, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-left truncate"
              onClick={() => loadChatSession(session)}
            >
              <span className="truncate block">
                {session[0]?.content || "Chat session"}
              </span>
              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                {new Date(session[0]?.timestamp).toLocaleString()}
              </span>
            </Button>
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ChatHistory;
