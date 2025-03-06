
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Message } from "@/types/chat";
import ChatMessages from "@/components/ChatMessages";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import ChatSearchResults from "./ChatSearchResults";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatContentProps {
  isWelcome: boolean;
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  mode: "chat" | "bookmark-search" | "web-search";
  handleQuerySubmit: (query: string) => void;
}

const ChatContent: React.FC<ChatContentProps> = ({
  isWelcome,
  messages,
  messagesEndRef,
  mode,
  handleQuerySubmit,
}) => {
  // Render search results for messages
  const renderSearchResults = (message: Message) => {
    return <ChatSearchResults message={message} />;
  };

  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full px-3 py-3">
        <AnimatePresence mode="wait">
          {isWelcome ? (
            <ChatWelcomeScreen mode={mode} handleQuerySubmit={handleQuerySubmit} />
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-2"
            >
              <ChatMessages 
                messages={messages} 
                messagesEndRef={messagesEndRef}
                renderAdditionalContent={renderSearchResults}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
};

export default ChatContent;
