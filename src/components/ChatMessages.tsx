import { Message } from "@/types/chat";
import { ScrollArea } from "./ui/scroll-area";
import { ExternalLink } from "lucide-react";

interface ChatMessagesProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages = ({ messages, messagesEndRef }: ChatMessagesProps) => {
  return (
    <ScrollArea className="flex-1 p-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">
            Start a conversation to get personalized insights from your bookmarks
          </p>
        </div>
      )}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.sender === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[85%] space-y-2 ${
              message.sender === "user"
                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5"
                : "bg-muted text-muted-foreground rounded-2xl rounded-tl-sm px-4 py-2.5"
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
            
            {message.bookmarks && message.bookmarks.length > 0 && (
              <div className="pt-2 border-t border-primary/10 space-y-1.5">
                <p className="text-xs font-medium opacity-75">From your bookmarks:</p>
                <div className="space-y-1">
                  {message.bookmarks.map((bookmark, index) => (
                    <a
                      key={index}
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs hover:underline opacity-90 hover:opacity-100"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {bookmark.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {message.webResults && message.webResults.length > 0 && (
              <div className="pt-2 border-t border-primary/10 space-y-1.5">
                <p className="text-xs font-medium opacity-75">Related links:</p>
                <div className="space-y-1">
                  {message.webResults.map((result, index) => (
                    <a
                      key={index}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs hover:underline opacity-90 hover:opacity-100"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {result.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
};

export default ChatMessages;