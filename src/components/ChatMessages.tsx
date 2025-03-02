
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { ExternalLink, User, Bot, Check, Mic } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatMessagesProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages = ({ messages, messagesEndRef }: ChatMessagesProps) => {
  const isMobile = useIsMobile();
  
  if (messages.length === 0) {
    return (
      <motion.div 
        className="flex-1 flex flex-col items-center justify-center p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-24 h-24 bg-gradient-to-br from-primary/30 to-primary/5 rounded-full flex items-center justify-center mb-8 shadow-inner"
        >
          <Bot className="h-10 w-10 text-primary/80" strokeWidth={1.5} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-2xl font-medium mb-3">Start Chatting</h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Ask questions or get insights about your bookmarks
          </p>
        </motion.div>
      </motion.div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';
  
  messages.forEach((message) => {
    const messageDate = new Date(message.timestamp || Date.now()).toLocaleDateString();
    
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groupedMessages.push({
        date: messageDate,
        messages: [message]
      });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message);
    }
  });

  return (
    <ScrollArea className="flex-1 px-3 py-2">
      <div className="space-y-6 pb-6">
        {groupedMessages.map((group, groupIndex) => (
          <div key={group.date} className="space-y-6">
            {/* Date divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-muted"></div>
              <span className="flex-shrink mx-4 text-xs font-medium text-muted-foreground/70 px-3 py-1 bg-muted/30 rounded-full">
                {group.date === new Date().toLocaleDateString() ? "Today" : group.date}
              </span>
              <div className="flex-grow border-t border-muted"></div>
            </div>
            
            {/* List view - chat bubbles */}
            <div className="space-y-6">
              {group.messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={cn(
                    "flex",
                    message.sender === "user" ? "justify-end" : "justify-start",
                    "gap-2 items-end"
                  )}
                >
                  {message.sender === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[85%] space-y-2 relative",
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3"
                        : "bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-3",
                      !message.isRead && message.sender === "assistant" && "ring-2 ring-primary/10"
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    
                    {message.bookmarks && message.bookmarks.length > 0 && (
                      <div className="pt-2 border-t border-primary/10 space-y-2 mt-2">
                        <p className="text-xs font-medium opacity-80">From your bookmarks:</p>
                        <div className="space-y-2">
                          {message.bookmarks.map((bookmark, index) => (
                            <a
                              key={index}
                              href={bookmark.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs hover:underline opacity-90 hover:opacity-100 group"
                            >
                              <div className="flex-shrink-0 h-6 w-6 bg-primary/20 rounded-lg flex items-center justify-center">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </div>
                              <span className="truncate group-hover:text-primary transition-colors">
                                {bookmark.title}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.webResults && message.webResults.length > 0 && (
                      <div className="pt-2 border-t border-primary/10 space-y-2 mt-2">
                        <p className="text-xs font-medium opacity-80">Related links:</p>
                        <div className="space-y-2">
                          {message.webResults.map((result, index) => (
                            <a
                              key={index}
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs hover:underline opacity-90 hover:opacity-100 group"
                            >
                              <div className="flex-shrink-0 h-6 w-6 bg-primary/20 rounded-lg flex items-center justify-center">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </div>
                              <span className="truncate group-hover:text-primary transition-colors">
                                {result.title}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Status indicators */}
                    <div className="absolute bottom-0 right-0 transform translate-y-6 flex items-center gap-0.5 text-[10px] text-muted-foreground opacity-70">
                      <span>
                        {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      {message.sender === "user" && message.isRead && (
                        <Check size={10} className="ml-0.5 opacity-80" />
                      )}
                    </div>
                  </div>
                  
                  {message.sender === "user" && (
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-16" /> {/* Extra space for scroll */}
      </div>
    </ScrollArea>
  );
};

export default ChatMessages;
