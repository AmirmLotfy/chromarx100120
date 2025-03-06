
import React, { useState } from "react";
import { Message } from "@/types/chat";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, Check, Bot, User } from "lucide-react";
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

  if (messages.length <= 1) {
    return <div ref={messagesEndRef} />;
  }

  return (
    <div className="flex flex-col space-y-4">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          className={cn(
            "flex items-start gap-2 group",
            message.sender === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.sender === "assistant" && (
            <Avatar className="h-6 w-6 mt-1 flex-shrink-0 bg-gradient-to-br from-primary/70 to-primary border-none shadow-sm">
              <Bot size={12} className="text-primary-foreground" />
            </Avatar>
          )}
          
          <div 
            className={cn(
              "relative rounded-lg px-3 py-2 max-w-[85%] text-sm",
              message.sender === "user" 
                ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm" 
                : "bg-muted/60 border border-muted-foreground/5 rounded-tl-none shadow-sm"
            )}
          >
            {highlightTerm ? (
              <HighlightedText text={message.content} highlight={highlightTerm} />
            ) : (
              <div className="whitespace-pre-wrap leading-relaxed text-[14px]">{message.content}</div>
            )}
            
            {message.sender === "assistant" && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity bg-background/70 hover:bg-background"
                onClick={() => copyToClipboard(message.content, message.id)}
              >
                {copiedMessageIds.includes(message.id) ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
            
            {renderAdditionalContent && message.sender === "assistant" && renderAdditionalContent(message)}
          </div>
          
          {message.sender === "user" && (
            <Avatar className="h-6 w-6 mt-1 flex-shrink-0 bg-primary text-primary-foreground shadow-sm">
              <User size={12} />
            </Avatar>
          )}
        </motion.div>
      ))}
      <div ref={messagesEndRef} className="h-1" />
    </div>
  );
};

export default ChatMessages;
