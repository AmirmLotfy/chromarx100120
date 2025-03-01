
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useBookmarkState } from "../../components/BookmarkStateManager";
import { Message, Conversation } from "@/types/chat";
import { useLanguage } from "@/stores/languageStore";
import { withErrorHandling } from "@/utils/errorUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { storage } from "@/services/storageService";
import { 
  STORAGE_KEY, 
  CONVERSATIONS_KEY, 
  RECENT_QUERIES_KEY, 
  saveRecentQuery, 
  saveChatHistory,
  saveConversation as saveChatConversation,
  updateConversation as updateChatConversation
} from "./chatStorageUtils";
import { 
  searchBookmarks, 
  processBookmarkSearch, 
  processQuery 
} from "./chatSearchUtils";
import { generateSuggestions } from "./suggestionUtils";
import { testAIReliability } from "@/utils/geminiUtils";

export const useChatState = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isConversationManagerOpen, setConversationManagerOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Conversation[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isBookmarkSearchMode, setIsBookmarkSearchMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { bookmarks } = useBookmarkState();
  const { currentLanguage } = useLanguage();
  const isMobile = useIsMobile();

  // Toggle bookmark search mode
  const toggleBookmarkSearchMode = useCallback(() => {
    setIsBookmarkSearchMode(prev => !prev);
    if (!isBookmarkSearchMode) {
      // Clear existing messages when entering search mode
      setMessages([]);
      setActiveConversation(undefined);
      // Add intro message
      const introMessage: Message = {
        id: Date.now().toString(),
        content: "I'm ready to help you find bookmarks. Describe what you're looking for in natural language, and I'll search your bookmarks for you.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages([introMessage]);
    }
  }, [isBookmarkSearchMode]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("You're back online");
      checkAIStatus();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast.error("You're offline");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if the device supports the Chrome Extension API
  const isExtensionEnvironment = useCallback(() => {
    return typeof chrome !== 'undefined' && chrome.storage !== undefined;
  }, []);

  // Check AI availability
  const checkAIStatus = useCallback(async () => {
    if (isOffline) return false;
    
    try {
      const isAvailable = await testAIReliability(currentLanguage.code);
      setIsAIAvailable(isAvailable);
      return isAvailable;
    } catch (err) {
      console.error("Error checking AI availability:", err);
      setIsAIAvailable(false);
      return false;
    }
  }, [currentLanguage.code, isOffline]);

  useEffect(() => {
    if (navigator.onLine) {
      checkAIStatus();
    }
  }, [checkAIStatus]);

  // Manually check connection status
  const checkConnection = useCallback(async () => {
    if (navigator.onLine) {
      const aiStatus = await checkAIStatus();
      if (aiStatus) {
        toast.success("Connection restored");
      } else {
        toast.error("Still having issues with the AI service");
      }
    } else {
      toast.error("You're still offline");
    }
  }, [checkAIStatus]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load chat history and conversations
  useEffect(() => {
    const loadChatData = async () => {
      try {
        // Load chat history
        const savedHistory = await storage.get<Conversation[]>(STORAGE_KEY);
        if (savedHistory) {
          setChatHistory(savedHistory);
        }
        
        // Load saved conversations
        const savedConversations = await storage.get<Conversation[]>(CONVERSATIONS_KEY);
        if (savedConversations) {
          setConversations(savedConversations);
        }
        
        // Load recent queries
        const queriesResult = await storage.get<string[]>(RECENT_QUERIES_KEY);
        if (queriesResult) {
          setRecentQueries(queriesResult);
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
      }
    };

    loadChatData();
  }, [isExtensionEnvironment]);

  // Save recent queries handler
  const handleSaveRecentQuery = useCallback((query: string) => {
    saveRecentQuery(query, recentQueries, setRecentQueries);
  }, [recentQueries]);

  // Save chat history handler
  const handleSaveChatHistory = useCallback((newMessages: Message[]) => {
    saveChatHistory(newMessages, chatHistory, setChatHistory);
  }, [chatHistory]);

  // Save conversation handler
  const saveConversation = useCallback((name: string, category: string) => {
    return saveChatConversation(
      name, 
      category, 
      messages, 
      activeConversation, 
      conversations, 
      setConversations, 
      setActiveConversation
    );
  }, [messages, activeConversation, conversations]);

  // Update conversation handler
  const updateConversation = useCallback((conversation: Conversation) => {
    return updateChatConversation(
      conversation, 
      conversations, 
      setConversations, 
      activeConversation, 
      setActiveConversation
    );
  }, [conversations, activeConversation]);

  const clearChat = useCallback(() => {
    if (messages.length > 0) {
      handleSaveChatHistory(messages);
      setMessages([]);
      setActiveConversation(undefined);
      
      // If in bookmark search mode, add intro message
      if (isBookmarkSearchMode) {
        const introMessage: Message = {
          id: Date.now().toString(),
          content: "I'm ready to help you find bookmarks. Describe what you're looking for in natural language, and I'll search your bookmarks for you.",
          sender: "assistant",
          timestamp: new Date(),
        };
        setMessages([introMessage]);
      } else {
        toast.success("Chat cleared");
      }
    } else {
      toast.info("No messages to clear");
    }
  }, [messages, isBookmarkSearchMode, handleSaveChatHistory]);

  const loadChatSession = useCallback((sessionMessages: Message[]) => {
    setMessages(sessionMessages);
    setIsHistoryOpen(false);
    
    // Check if this corresponds to a saved conversation
    const conversation = conversations.find(c => 
      c.messages.length > 0 && 
      c.messages[0].id === sessionMessages[0].id
    );
    
    setActiveConversation(conversation);
    scrollToBottom();
    toast.success("Chat session loaded");
  }, [conversations, scrollToBottom]);

  // Handle sending a message
  const handleSendMessage = async (inputValue: string) => {
    if (!inputValue.trim()) {
      toast.error("Please enter a message");
      return;
    }

    // Save to recent queries
    handleSaveRecentQuery(inputValue);

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
      let result;
      
      // Process differently based on mode
      if (isBookmarkSearchMode) {
        result = await withErrorHandling(
          async () => await processBookmarkSearch(
            inputValue, 
            bookmarks, 
            isOffline, 
            isAIAvailable, 
            currentLanguage
          ),
          {
            errorMessage: "Failed to search bookmarks",
            showError: false,
            rethrow: true
          }
        );
      } else {
        result = await withErrorHandling(
          async () => await processQuery(
            inputValue, 
            messages, 
            bookmarks, 
            isOffline, 
            isAIAvailable, 
            currentLanguage
          ),
          {
            errorMessage: "Failed to process your request",
            showError: false,
            rethrow: true
          }
        );
      }

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
        
        // Generate new suggestions based on the latest messages
        generateSuggestions(
          messages.concat([userMessage, assistantMessage]), 
          isBookmarkSearchMode, 
          setSuggestions
        );
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
      setMessages(messages.filter(m => m.id !== messages[messages.length - 1].id));
      setError(null);
      await handleSendMessage(lastUserMessage.content);
    }
  };

  // Effects for suggestion generation
  useEffect(() => {
    if (messages.length > 1) {
      generateSuggestions(messages, isBookmarkSearchMode, setSuggestions);
    }
  }, [messages, isBookmarkSearchMode]);

  return {
    messages,
    isProcessing,
    error,
    isOffline,
    isAIAvailable,
    suggestions,
    isHistoryOpen,
    setIsHistoryOpen,
    isConversationManagerOpen,
    setConversationManagerOpen,
    chatHistory,
    messagesEndRef,
    handleSendMessage,
    clearChat,
    loadChatSession,
    retryLastMessage,
    checkConnection,
    recentQueries,
    isMobile,
    activeConversation,
    saveConversation,
    updateConversation,
    conversations,
    isBookmarkSearchMode,
    toggleBookmarkSearchMode
  };
};
