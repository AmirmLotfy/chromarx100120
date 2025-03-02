
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { ExternalLink, User, Bot } from "lucide-react";
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
          className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-6 shadow-inner"
        >
          <Bot className="h-8 w-8 text-primary/70" strokeWidth={1.5} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-xl font-medium mb-2">Start Chatting</h3>
          <p className="text-sm text-muted-foreground">
            Ask questions about your bookmarks
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
    <div className="px-2 py-2">
      <div className="space-y-4">
        {groupedMessages.map((group, groupIndex) => (
          <div key={group.date} className="space-y-4">
            {/* Date divider - simplified */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-muted"></div>
              <span className="flex-shrink mx-4 text-xs text-muted-foreground/70 px-2 py-0.5 bg-muted/20 rounded-full">
                {group.date === new Date().toLocaleDateString() ? "Today" : group.date}
              </span>
              <div className="flex-grow border-t border-muted"></div>
            </div>
            
            {/* List view - chat bubbles */}
            <div className="space-y-3">
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
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[85%] relative",
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2.5"
                        : "bg-muted text-foreground rounded-2xl rounded-tl-sm px-3 py-2.5",
                      !message.isRead && message.sender === "assistant" && "ring-1 ring-primary/10"
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    
                    {message.bookmarks && message.bookmarks.length > 0 && (
                      <div className="pt-2 border-t border-primary/10 mt-2">
                        <p className="text-xs font-medium opacity-80">From bookmarks:</p>
                        <div className="space-y-1.5 mt-1.5">
                          {message.bookmarks.map((bookmark, index) => (
                            <a
                              key={index}
                              href={bookmark.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs hover:underline opacity-90 hover:opacity-100 group"
                            >
                              <div className="flex-shrink-0 h-5 w-5 bg-primary/10 rounded flex items-center justify-center">
                                <ExternalLink className="h-3 w-3" />
                              </div>
                              <span className="truncate group-hover:text-primary transition-colors">
                                {bookmark.title}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Simplified web results */}
                    {message.webResults && message.webResults.length > 0 && (
                      <div className="pt-2 border-t border-primary/10 mt-2">
                        <p className="text-xs font-medium opacity-80">Related:</p>
                        <div className="space-y-1.5 mt-1.5">
                          {message.webResults.map((result, index) => (
                            <a
                              key={index}
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs hover:underline opacity-90 hover:opacity-100 group"
                            >
                              <div className="flex-shrink-0 h-5 w-5 bg-primary/10 rounded flex items-center justify-center">
                                <ExternalLink className="h-3 w-3" />
                              </div>
                              <span className="truncate group-hover:text-primary transition-colors">
                                {result.title}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Simplified time indicator */}
                    <div className="absolute bottom-0 right-0 transform translate-y-5 flex items-center text-[10px] text-muted-foreground opacity-70">
                      {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  
                  {message.sender === "user" && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-12" /> {/* Extra space for scroll */}
      </div>
    </div>
  );
};

export default ChatMessages;
