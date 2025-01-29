import { Message } from "@/types/chat";

interface ChatMessagesProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages = ({ messages, messagesEndRef }: ChatMessagesProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.sender === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[80%] space-y-1.5 ${
              message.sender === "user"
                ? "bg-primary text-primary-foreground ml-4 p-2.5 rounded-lg"
                : "bg-muted text-muted-foreground mr-4 p-2.5 rounded-lg"
            }`}
          >
            <div className="text-sm">{message.content}</div>
            {message.bookmarks && message.bookmarks.length > 0 && (
              <div className="mt-1.5 space-y-1 text-xs">
                <div className="font-medium">Related Bookmarks:</div>
                {message.bookmarks.map((bookmark, index) => (
                  <a
                    key={index}
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:underline text-blue-500 dark:text-blue-400"
                  >
                    {bookmark.title}
                  </a>
                ))}
              </div>
            )}
            {message.webResults && message.webResults.length > 0 && (
              <div className="mt-1.5 space-y-1 text-xs">
                <div className="font-medium">Suggested Links:</div>
                {message.webResults.map((result, index) => (
                  <a
                    key={index}
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:underline text-blue-500 dark:text-blue-400"
                  >
                    {result.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;