import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useBookmarkState } from "./BookmarkStateManager";
import { summarizeContent } from "@/utils/geminiUtils";
import { searchWebResults } from "@/utils/searchUtils";
import { getContextFromHistory, generateChatPrompt } from "@/utils/chatContextUtils";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import { Message } from "@/types/chat";

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
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
      const [relevantBookmarks, webResults] = await Promise.all([
        Promise.resolve(searchBookmarks(query)),
        searchWebResults(query),
      ]);

      const bookmarkContext = relevantBookmarks
        .map((b) => `${b.title} (${b.url})`)
        .join("\n");

      const chatContext = getContextFromHistory(messages, query);
      const prompt = generateChatPrompt(query, bookmarkContext, chatContext);

      const response = await summarizeContent(prompt);

      return {
        response,
        bookmarks: relevantBookmarks.map((b) => ({
          title: b.title,
          url: b.url || "",
          relevance: 1,
        })),
        webResults,
      };
    } catch (error) {
      console.error("Error processing query:", error);
      throw error;
    }
  };

  const handleSendMessage = async (inputValue: string) => {
    if (!inputValue.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const { response, bookmarks: relevantBookmarks, webResults } = await processQuery(
        inputValue
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: "assistant",
        timestamp: new Date(),
        bookmarks: relevantBookmarks,
        webResults,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Failed to process your request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSuggestions = (query: string) => {
    if (query.length < 2) return [];
    
    const bookmarkSuggestions = bookmarks
      .filter(b => b.title.toLowerCase().includes(query.toLowerCase()))
      .map(b => b.title)
      .slice(0, 3);

    const previousQueries = messages
      .filter(m => m.sender === "user" && m.content.toLowerCase().includes(query.toLowerCase()))
      .map(m => m.content)
      .slice(0, 2);

    const recentTopics = messages
      .filter(m => m.sender === "assistant")
      .flatMap(m => m.content.split(" "))
      .filter(word => word.length > 4)
      .filter(word => word.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2);

    return [...new Set([...bookmarkSuggestions, ...previousQueries, ...recentTopics])];
  };

  useEffect(() => {
    const handleSuggestions = (query: string) => {
      const newSuggestions = generateSuggestions(query);
      setSuggestions(newSuggestions);
    };

    const debounce = setTimeout(() => {
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.sender === "user") {
          handleSuggestions(lastMessage.content);
        }
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [messages, bookmarks]);

  return (
    <div className="flex flex-col h-[600px] bg-background border rounded-lg shadow-sm">
      <ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
      <div className="border-t p-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          suggestions={suggestions}
        />
      </div>
    </div>
  );
};

export default ChatInterface;