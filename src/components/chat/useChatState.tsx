
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useBookmarkState } from "../BookmarkStateManager";
import { summarizeContent } from "@/utils/geminiUtils";
import { searchWebResults } from "@/utils/searchUtils";
import { getContextFromHistory, generateChatPrompt, extractTopicsFromMessages } from "@/utils/chatContextUtils";
import { Message } from "@/types/chat";
import { useLanguage } from "@/stores/languageStore";
import { testAIReliability } from "@/utils/geminiUtils";
import { withErrorHandling } from "@/utils/errorUtils";
import { retryWithBackoff } from "@/utils/retryUtils";
import { useIsMobile } from "@/hooks/use-mobile";

const STORAGE_KEY = 'chromarx_chat_history';

export const useChatState = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[][]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { bookmarks } = useBookmarkState();
  const { currentLanguage } = useLanguage();
  const isMobile = useIsMobile();

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check AI availability
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const isAvailable = await testAIReliability(currentLanguage.code);
        setIsAIAvailable(isAvailable);
      } catch (err) {
        console.error("Error checking AI availability:", err);
        setIsAIAvailable(false);
      }
    };
    
    if (navigator.onLine) {
      checkAIStatus();
    }
  }, [currentLanguage.code, isOffline]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load chat history
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
      setError(null);
      
      if (isOffline) {
        throw new Error("You're currently offline. Please check your connection and try again.");
      }
      
      if (!isAIAvailable) {
        throw new Error("AI service is currently unavailable. Please try again later.");
      }

      // Run bookmark search and web search in parallel
      const [relevantBookmarks, webResults] = await Promise.all([
        Promise.resolve(searchBookmarks(query)),
        searchWebResults(query).catch(err => {
          console.error("Web search error:", err);
          return []; // Fallback to empty results on error
        }),
      ]);

      const bookmarkContext = relevantBookmarks
        .map((b) => `${b.title} (${b.url})`)
        .join("\n");

      const chatContext = getContextFromHistory(messages, query);
      const prompt = generateChatPrompt(query, bookmarkContext, chatContext, currentLanguage);

      const response = await retryWithBackoff(
        () => summarizeContent(prompt, currentLanguage.code),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (error, attempt) => {
            console.log(`Retry attempt ${attempt} after error:`, error);
          }
        }
      );

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
    setError(null);

    try {
      const result = await withErrorHandling(
        async () => await processQuery(inputValue),
        {
          errorMessage: "Failed to process your request",
          showError: false,
          rethrow: true
        }
      );

      if (result) {
        const { response, bookmarks: relevantBookmarks, webResults } = result;

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          sender: "assistant",
          timestamp: new Date(),
          bookmarks: relevantBookmarks,
          webResults,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error("Error in handleSendMessage:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Add error message for user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I couldn't process your request. Please try again later.",
        sender: "assistant",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const retryLastMessage = async () => {
    const lastUserMessage = [...messages].reverse().find(m => m.sender === "user");
    if (lastUserMessage) {
      // Remove the error message if it exists
      setMessages(messages.slice(0, -1));
      await handleSendMessage(lastUserMessage.content);
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

  return {
    messages,
    isProcessing,
    error,
    isOffline,
    isAIAvailable,
    suggestions,
    isHistoryOpen,
    setIsHistoryOpen,
    chatHistory,
    messagesEndRef,
    handleSendMessage,
    clearChat,
    loadChatSession,
    retryLastMessage,
    isMobile
  };
};
