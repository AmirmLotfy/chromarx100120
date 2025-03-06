
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
            <Avatar className="h-7 w-7 mt-1 flex-shrink-0 bg-primary/10 text-primary border border-primary/20">
              <Bot size={13} />
            </Avatar>
          )}
          
          <div 
            className={cn(
              "relative rounded-2xl px-3.5 py-2.5 max-w-[85%] text-sm shadow-sm",
              message.sender === "user" 
                ? "bg-primary text-primary-foreground rounded-tr-none" 
                : "bg-accent/50 backdrop-blur-sm border border-muted-foreground/10 rounded-tl-none"
            )}
          >
            {highlightTerm ? (
              <HighlightedText text={message.content} highlight={highlightTerm} />
            ) : (
              <div className="whitespace-pre-wrap leading-relaxed text-[13px]">{message.content}</div>
            )}
            
            {message.sender === "assistant" && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1.5 right-1.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity bg-background/70 hover:bg-background"
                onClick={() => copyToClipboard(message.content, message.id)}
              >
                {copiedMessageIds.includes(message.id) ? (
                  <Check className="h-2.5 w-2.5" />
                ) : (
                  <Copy className="h-2.5 w-2.5" />
                )}
              </Button>
            )}
            
            {renderAdditionalContent && message.sender === "assistant" && renderAdditionalContent(message)}
          </div>
          
          {message.sender === "user" && (
            <Avatar className="h-7 w-7 mt-1 flex-shrink-0 bg-primary text-primary-foreground border border-primary/20">
              <User size={13} />
            </Avatar>
          )}
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
