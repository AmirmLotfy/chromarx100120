
import React, { useState } from "react";
import { Message } from "@/types/chat";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, Check, Bot, User, Sparkles } from "lucide-react";
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
    <div className="flex flex-col space-y-6">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className={cn(
            "flex items-start gap-3 group",
            message.sender === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.sender === "assistant" && (
            <Avatar className="h-8 w-8 mt-1 flex-shrink-0 bg-primary/10 text-primary border border-primary/20">
              <Bot size={14} />
            </Avatar>
          )}
          
          <div 
            className={cn(
              "relative rounded-2xl px-4 py-3 max-w-[85%] text-sm shadow-sm",
              message.sender === "user" 
                ? "bg-primary text-primary-foreground rounded-tr-none" 
                : "bg-muted/50 backdrop-blur-sm border border-muted-foreground/10 rounded-tl-none"
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
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
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
            <Avatar className="h-8 w-8 mt-1 flex-shrink-0 bg-primary text-primary-foreground border border-primary/20">
              <User size={14} />
            </Avatar>
          )}
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
