
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

  return (
    <div className="flex flex-col space-y-8 p-4 sm:p-6">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className={cn(
            "flex gap-4 group max-w-[90%]",
            message.sender === "user" ? "self-end" : "self-start"
          )}
        >
          {message.sender === "assistant" && (
            <div className="mt-1 flex-shrink-0">
              <Avatar className="h-9 w-9 bg-primary/10 text-primary border border-primary/20 shadow-sm">
                <Bot size={16} />
              </Avatar>
            </div>
          )}
          
          <div 
            className={cn(
              "relative rounded-2xl px-4 py-3.5 text-sm",
              message.sender === "user" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "bg-muted/40 backdrop-blur-sm border border-muted-foreground/10 shadow-sm"
            )}
          >
            {highlightTerm ? (
              <HighlightedText text={message.content} highlight={highlightTerm} />
            ) : (
              <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
            )}
            
            {message.sender === "assistant" && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
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
            <div className="mt-1 flex-shrink-0">
              <Avatar className="h-9 w-9 bg-primary text-primary-foreground border border-primary/20 shadow-sm">
                <User size={16} />
              </Avatar>
            </div>
          )}
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
