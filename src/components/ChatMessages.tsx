
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
      "max-w-[90%] md:max-w-[75%] space-y-2",
      message.sender === "user"
        ? "bg-gradient-to-br from-primary/80 to-primary/70 text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-md"
        : "bg-gradient-to-br from-muted/90 to-muted/70 text-foreground rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-md"
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
            className="text-center space-y-3 max-w-sm mx-auto p-8 rounded-xl bg-accent/20 backdrop-blur-sm border border-primary/10 shadow-sm"
          >
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground/90">Start a Conversation</h3>
            <p className="text-sm text-muted-foreground">
              Ask questions about your bookmarks or search for specific content
            </p>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-6 pb-4">
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
                          className="flex items-center gap-1.5 text-xs hover:underline opacity-90 hover:opacity-100 rounded-md py-1.5 px-2 bg-background/30 hover:bg-background/50 transition-colors"
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
                          className="flex items-center gap-1.5 text-xs hover:underline opacity-90 hover:opacity-100 rounded-md py-1.5 px-2 bg-background/30 hover:bg-background/50 transition-colors"
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
