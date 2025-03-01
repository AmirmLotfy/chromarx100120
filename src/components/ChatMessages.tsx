
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { ExternalLink, User, Bot, Star } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { motion } from "framer-motion";

interface ChatMessagesProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages = ({ messages, messagesEndRef }: ChatMessagesProps) => {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Bot className="h-8 w-8 text-primary/70" />
        </div>
        <h3 className="text-lg font-medium mb-2">Start a Conversation</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Ask questions about your bookmarks or any topic to get personalized insights.
        </p>
      </div>
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
    <ScrollArea className="flex-1 p-3">
      <div className="space-y-4 pb-2">
        {groupedMessages.map((group, groupIndex) => (
          <div key={group.date} className="space-y-4">
            {/* Date divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-muted"></div>
              <span className="flex-shrink mx-4 text-xs text-muted-foreground">
                {group.date === new Date().toLocaleDateString() ? "Today" : group.date}
              </span>
              <div className="flex-grow border-t border-muted"></div>
            </div>
            
            {group.messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex",
                  message.sender === "user" ? "justify-end" : "justify-start",
                  "gap-2"
                )}
              >
                {message.sender === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[85%] space-y-2 relative",
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5"
                      : "bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-2.5",
                    !message.isRead && message.sender === "assistant" && "ring-2 ring-primary/30"
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  
                  {message.bookmarks && message.bookmarks.length > 0 && (
                    <div className="pt-2 border-t border-primary/10 space-y-1.5 mt-1">
                      <p className="text-xs font-medium opacity-80">From your bookmarks:</p>
                      <div className="space-y-1.5">
                        {message.bookmarks.map((bookmark, index) => {
                          // Calculate relevance score (normally would come from API)
                          const relevance = bookmark.relevanceScore || Math.random() * 3;
                          return (
                            <a
                              key={index}
                              href={bookmark.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-1.5 text-xs hover:underline opacity-90 hover:opacity-100 group p-1.5 rounded-md ${
                                relevance > 2 ? "bg-primary/10" : relevance > 1 ? "bg-primary/5" : ""
                              }`}
                            >
                              <div className="flex-shrink-0 h-4 w-4 bg-primary/20 rounded-sm flex items-center justify-center">
                                <ExternalLink className="h-2.5 w-2.5" />
                              </div>
                              <span className="truncate group-hover:text-primary transition-colors flex-1">
                                {bookmark.title}
                              </span>
                              {relevance > 2 && (
                                <span className="flex items-center">
                                  <Star className="h-3 w-3 fill-primary/70 text-primary/70" />
                                  <Star className="h-3 w-3 fill-primary/70 text-primary/70" />
                                  <Star className="h-3 w-3 fill-primary/70 text-primary/70" />
                                </span>
                              )}
                              {relevance > 1 && relevance <= 2 && (
                                <span className="flex items-center">
                                  <Star className="h-3 w-3 fill-primary/70 text-primary/70" />
                                  <Star className="h-3 w-3 fill-primary/70 text-primary/70" />
                                </span>
                              )}
                              {relevance <= 1 && (
                                <span className="flex items-center">
                                  <Star className="h-3 w-3 fill-primary/70 text-primary/70" />
                                </span>
                              )}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {message.webResults && message.webResults.length > 0 && (
                    <div className="pt-2 border-t border-primary/10 space-y-1.5 mt-1">
                      <p className="text-xs font-medium opacity-80">Related links:</p>
                      <div className="space-y-1.5">
                        {message.webResults.map((result, index) => (
                          <a
                            key={index}
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs hover:underline opacity-90 hover:opacity-100 group"
                          >
                            <div className="flex-shrink-0 h-4 w-4 bg-primary/20 rounded-sm flex items-center justify-center">
                              <ExternalLink className="h-2.5 w-2.5" />
                            </div>
                            <span className="truncate group-hover:text-primary transition-colors">
                              {result.title}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  <div className="absolute bottom-0 transform translate-y-5 text-[10px] text-muted-foreground opacity-70">
                    {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                
                {message.sender === "user" && (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} className="h-8" /> {/* Extra space for scroll */}
      </div>
    </ScrollArea>
  );
};

export default ChatMessages;
