
import React, { useState } from "react";
import { Message } from "@/types/chat";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import HighlightedText from "./HighlightedText";
import { motion } from "framer-motion";

export interface ChatMessagesProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  highlightTerm?: string;
  renderAdditionalContent?: (message: Message) => React.ReactNode;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  messagesEndRef,
  highlightTerm,
  renderAdditionalContent,
}) => {
  const [copiedMessageIds, setCopiedMessageIds] = useState<string[]>([]);

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageIds([...copiedMessageIds, messageId]);
    setTimeout(() => {
      setCopiedMessageIds(copiedMessageIds.filter(id => id !== messageId));
    }, 2000);
  };

  return (
    <div className="flex flex-col space-y-4 p-2">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className={cn(
            "flex gap-3 group",
            message.sender === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.sender === "assistant" && (
            <Avatar className="h-8 w-8 bg-primary/10 flex-shrink-0 mt-1">
              <span className="text-xs text-primary/70">AI</span>
            </Avatar>
          )}
          
          <div 
            className={cn(
              "relative rounded-xl p-3 text-sm max-w-[85%] sm:max-w-[75%]",
              message.sender === "user" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted border border-muted-foreground/10"
            )}
          >
            {highlightTerm ? (
              <HighlightedText text={message.content} searchTerm={highlightTerm} />
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
            
            {message.sender === "assistant" && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(message.content, message.id)}
              >
                {copiedMessageIds.includes(message.id) ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
            
            {renderAdditionalContent && message.sender === "assistant" && renderAdditionalContent(message)}
          </div>
          
          {message.sender === "user" && (
            <Avatar className="h-8 w-8 bg-primary/20 flex-shrink-0 mt-1">
              <span className="text-xs text-primary">You</span>
            </Avatar>
          )}
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
