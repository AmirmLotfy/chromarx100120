
import { Message } from "@/types/chat";
import { ScrollArea } from "./ui/scroll-area";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ChatMessagesProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages = ({ messages, messagesEndRef }: ChatMessagesProps) => {
  const getMessageClassName = (message: Message) => {
    return cn(
      "max-w-[85%] md:max-w-[75%] space-y-2",
      message.sender === "user"
        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-md"
        : "bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-md"
    );
  };

  return (
    <ScrollArea className="h-full p-3 md:p-4 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-3 max-w-xs mx-auto p-6 rounded-xl bg-accent/30 backdrop-blur-sm border border-border/50 shadow-sm"
          >
            <p className="text-sm font-medium text-foreground/80">
              Start a conversation to get insights
            </p>
            <p className="text-xs text-muted-foreground">
              Ask questions about your bookmarks or toggle search mode to find specific saved content
            </p>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-4 pb-2">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={cn(
                "flex",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div className={getMessageClassName(message)}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                
                {message.bookmarks && message.bookmarks.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-primary/10 space-y-1.5">
                    <p className="text-xs font-medium opacity-75">Related bookmarks:</p>
                    <div className="space-y-1.5">
                      {message.bookmarks.map((bookmark, index) => (
                        <a
                          key={index}
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs hover:underline opacity-90 hover:opacity-100 rounded-md py-1.5 px-2 bg-background/20 hover:bg-background/40 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{bookmark.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {message.webResults && message.webResults.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-primary/10 space-y-1.5">
                    <p className="text-xs font-medium opacity-75">Web results:</p>
                    <div className="space-y-1.5">
                      {message.webResults.map((result, index) => (
                        <a
                          key={index}
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs hover:underline opacity-90 hover:opacity-100 rounded-md py-1.5 px-2 bg-background/20 hover:bg-background/40 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{result.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </ScrollArea>
  );
};

export default ChatMessages;
