import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useBookmarkState } from "./BookmarkStateManager";
import { summarizeContent } from "@/utils/geminiUtils";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  bookmarks?: {
    title: string;
    url: string;
    relevance: number;
  }[];
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { bookmarks } = useBookmarkState();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const searchBookmarks = (query: string) => {
    return bookmarks.filter((bookmark) => {
      const titleMatch = bookmark.title.toLowerCase().includes(query.toLowerCase());
      const urlMatch = bookmark.url?.toLowerCase().includes(query.toLowerCase());
      return titleMatch || urlMatch;
    });
  };

  const processQuery = async (query: string) => {
    try {
      const relevantBookmarks = searchBookmarks(query);
      const bookmarkContext = relevantBookmarks
        .map((b) => `${b.title} (${b.url})`)
        .join("\n");

      const prompt = `Based on this query: "${query}"
        Here are relevant bookmarks:\n${bookmarkContext}\n
        Please provide a helpful response that includes relevant information from these bookmarks.
        If no bookmarks are relevant, suggest some search terms.`;

      const response = await summarizeContent(prompt);

      return {
        response,
        bookmarks: relevantBookmarks.map((b) => ({
          title: b.title,
          url: b.url || "",
          relevance: 1,
        })),
      };
    } catch (error) {
      console.error("Error processing query:", error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    try {
      const { response, bookmarks: relevantBookmarks } = await processQuery(
        inputValue
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: "assistant",
        timestamp: new Date(),
        bookmarks: relevantBookmarks,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Failed to process your request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-background border rounded-lg shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] space-y-2 ${
                message.sender === "user"
                  ? "bg-primary text-primary-foreground ml-4 p-3 rounded-lg"
                  : "bg-muted text-muted-foreground mr-4 p-3 rounded-lg"
              }`}
            >
              <div>{message.content}</div>
              {message.bookmarks && message.bookmarks.length > 0 && (
                <div className="mt-2 space-y-1 text-sm">
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
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            disabled={isProcessing}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;