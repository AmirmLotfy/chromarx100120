import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Trash2, ChevronDown } from "lucide-react";
import { useBookmarkState } from "./BookmarkStateManager";
import { summarizeContent } from "@/utils/geminiUtils";
import { searchWebResults } from "@/utils/searchUtils";
import { getContextFromHistory, generateChatPrompt, extractTopicsFromMessages } from "@/utils/chatContextUtils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import { Message } from "@/types/chat";
import { useLanguage } from "@/stores/languageStore";

const STORAGE_KEY = 'chromarx_chat_history';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[][]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { bookmarks } = useBookmarkState();
  const { currentLanguage } = useLanguage();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          const result = await chrome.storage.local.get([STORAGE_KEY]);
          if (result[STORAGE_KEY]) {
            setChatHistory(result[STORAGE_KEY]);
          }
        } else {
          const savedHistory = localStorage.getItem(STORAGE_KEY);
          if (savedHistory) {
            setChatHistory(JSON.parse(savedHistory));
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, []);

  const saveChatHistory = useCallback(async (newMessages: Message[]) => {
    if (newMessages.length === 0) return;
    
    try {
      const updatedHistory = [newMessages, ...chatHistory].slice(0, 10);

      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({ [STORAGE_KEY]: updatedHistory });
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      }
      
      setChatHistory(updatedHistory);
    } catch (error) {
      console.error('Error saving chat history:', error);
      toast.error('Failed to save chat history');
    }
  }, [chatHistory]);

  const clearChat = () => {
    if (messages.length > 0) {
      saveChatHistory(messages);
      setMessages([]);
      toast.success("Chat cleared successfully");
    }
  };

  const loadChatSession = (sessionMessages: Message[]) => {
    setMessages(sessionMessages);
    setIsHistoryOpen(false);
    scrollToBottom();
  };

  const searchBookmarks = useCallback((query: string) => {
    return bookmarks.filter((bookmark) => {
      const titleMatch = bookmark.title.toLowerCase().includes(query.toLowerCase());
      const urlMatch = bookmark.url?.toLowerCase().includes(query.toLowerCase());
      const categoryMatch = bookmark.category?.toLowerCase().includes(query.toLowerCase());
      return titleMatch || urlMatch || categoryMatch;
    });
  }, [bookmarks]);

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
      const prompt = generateChatPrompt(query, bookmarkContext, chatContext, currentLanguage);

      const response = await summarizeContent(prompt, currentLanguage);

      return {
        response,
        bookmarks: relevantBookmarks.slice(0, 5).map((b) => ({
          title: b.title,
          url: b.url || "",
          relevance: 1,
        })),
        webResults: webResults.slice(0, 3),
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

      setMessages((prev) => {
        const newMessages = [...prev, assistantMessage];
        return newMessages;
      });
    } catch (error) {
      toast.error("Failed to process your request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSuggestions = useCallback((query: string) => {
    if (query.length < 2) return [];
    
    const bookmarkSuggestions = bookmarks
      .filter(b => b.title.toLowerCase().includes(query.toLowerCase()))
      .map(b => b.title)
      .slice(0, 3);

    const previousQueries = messages
      .filter(m => m.sender === "user" && m.content.toLowerCase().includes(query.toLowerCase()))
      .map(m => m.content)
      .slice(0, 2);

    const topics = extractTopicsFromMessages(messages)
      .filter(topic => topic.includes(query.toLowerCase()))
      .slice(0, 2);

    return [...new Set([...bookmarkSuggestions, ...previousQueries, ...topics])];
  }, [bookmarks, messages]);

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
  }, [messages, generateSuggestions]);

  return (
    <div className="flex flex-col h-[calc(100dvh-12rem)] md:h-[600px] bg-background border rounded-lg shadow-sm">
      <div className="flex justify-end p-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearChat}
          className="text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Chat
        </Button>
      </div>
      
      <ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
      
      <div className="border-t p-3">
        <ChatInput
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          suggestions={suggestions}
        />
      </div>

      <Collapsible
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        className="border-t"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center justify-between p-2 hover:bg-accent"
          >
            Recent Chat History
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
              isHistoryOpen ? "transform rotate-180" : ""
            }`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-2 space-y-2">
          {chatHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No chat history available
            </p>
          ) : (
            chatHistory.map((session, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left"
                onClick={() => loadChatSession(session)}
              >
                <span className="truncate">
                  {session[0]?.content || "Chat session"}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {session[0]?.timestamp.toLocaleString()}
                </span>
              </Button>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ChatInterface;
