
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useBookmarkState } from "../BookmarkStateManager";
import { summarizeContent } from "@/utils/geminiUtils";
import { searchWebResults } from "@/utils/searchUtils";
import { getContextFromHistory, generateChatPrompt, extractTopicsFromMessages } from "@/utils/chatContextUtils";
import { Message, Conversation } from "@/types/chat";
import { useLanguage } from "@/stores/languageStore";
import { testAIReliability } from "@/utils/geminiUtils";
import { withErrorHandling } from "@/utils/errorUtils";
import { retryWithBackoff } from "@/utils/retryUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { aiRequestManager } from "@/utils/aiRequestManager";
import { storage } from "@/services/storageService";
import { findBookmarksByContent } from "@/utils/bookmarkUtils";

const STORAGE_KEY = 'chromarx_chat_history';
const CONVERSATIONS_KEY = 'chromarx_conversations';
const RECENT_QUERIES_KEY = 'chromarx_recent_queries';
const MAX_RECENT_QUERIES = 5;

export const useChatState = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isConversationManagerOpen, setConversationManagerOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[][]>([]);
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
        const savedHistory = await storage.get<Message[][]>(STORAGE_KEY);
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

  const saveRecentQuery = useCallback(async (query: string) => {
    try {
      // Don't save duplicate or empty queries
      if (!query.trim() || recentQueries.includes(query)) return;
      
      const updatedQueries = [query, ...recentQueries].slice(0, MAX_RECENT_QUERIES);
      setRecentQueries(updatedQueries);
      await storage.set(RECENT_QUERIES_KEY, updatedQueries);
    } catch (error) {
      console.error('Error saving recent query:', error);
    }
  }, [recentQueries]);

  const saveChatHistory = useCallback(async (newMessages: Message[]) => {
    if (newMessages.length === 0) return;
    
    try {
      const updatedHistory = [newMessages, ...chatHistory].slice(0, 10);
      await storage.set(STORAGE_KEY, updatedHistory);
      setChatHistory(updatedHistory);
    } catch (error) {
      console.error('Error saving chat history:', error);
      toast.error('Failed to save chat history');
    }
  }, [chatHistory]);

  const saveConversation = useCallback(async (name: string, category: string) => {
    if (messages.length === 0) {
      toast.error("Cannot save an empty conversation");
      return;
    }
    
    try {
      const newConversation: Conversation = {
        id: activeConversation?.id || Date.now().toString(),
        name,
        category,
        messages: [...messages],
        createdAt: activeConversation?.createdAt || new Date(),
        updatedAt: new Date(),
        pinned: activeConversation?.pinned || false
      };
      
      let updatedConversations: Conversation[];
      
      if (activeConversation) {
        // Update existing conversation
        updatedConversations = conversations.map(c => 
          c.id === activeConversation.id ? newConversation : c
        );
      } else {
        // Add new conversation
        updatedConversations = [newConversation, ...conversations];
      }
      
      await storage.set(CONVERSATIONS_KEY, updatedConversations);
      setConversations(updatedConversations);
      setActiveConversation(newConversation);
      
      toast.success(`Conversation "${name}" saved`);
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast.error('Failed to save conversation');
    }
  }, [messages, activeConversation, conversations]);

  const updateConversation = useCallback(async (conversation: Conversation) => {
    try {
      const updatedConversations = conversations.map(c => 
        c.id === conversation.id ? conversation : c
      );
      
      await storage.set(CONVERSATIONS_KEY, updatedConversations);
      setConversations(updatedConversations);
      
      if (activeConversation?.id === conversation.id) {
        setActiveConversation(conversation);
      }
      
      toast.success(`Conversation "${conversation.name}" updated`);
    } catch (error) {
      console.error('Error updating conversation:', error);
      toast.error('Failed to update conversation');
    }
  }, [conversations, activeConversation]);

  const clearChat = () => {
    if (messages.length > 0) {
      saveChatHistory(messages);
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
  };

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

  const searchBookmarks = useCallback((query: string) => {
    return bookmarks.filter((bookmark) => {
      const titleMatch = bookmark.title.toLowerCase().includes(query.toLowerCase());
      const urlMatch = bookmark.url?.toLowerCase().includes(query.toLowerCase());
      const categoryMatch = bookmark.category?.toLowerCase().includes(query.toLowerCase());
      return titleMatch || urlMatch || categoryMatch;
    });
  }, [bookmarks]);

  // Enhanced bookmark search function
  const processBookmarkSearch = async (query: string) => {
    try {
      setError(null);
      
      if (isOffline) {
        throw new Error("You're currently offline. Please check your connection and try again.");
      }
      
      if (!isAIAvailable) {
        throw new Error("AI service is currently unavailable. Please try again later.");
      }

      // Check for rate limiting
      const throttleCheck = await aiRequestManager.isThrottled();
      if (throttleCheck.throttled) {
        throw new Error(`Request rate limited: ${throttleCheck.reason || "Too many requests"}`);
      }

      // Step 1: Use the advanced bookmark search by content
      const contentMatchedBookmarks = await findBookmarksByContent(query, bookmarks);
      
      // Step 2: Also search by metadata (title, URL, category)
      const metadataMatchedBookmarks = searchBookmarks(query);
      
      // Step 3: Combine results uniquely (by ID)
      const allBookmarkIds = new Set();
      const combinedBookmarks = [];
      
      // First add content matches (likely most relevant)
      for (const bookmark of contentMatchedBookmarks) {
        if (!allBookmarkIds.has(bookmark.id)) {
          allBookmarkIds.add(bookmark.id);
          combinedBookmarks.push(bookmark);
        }
      }
      
      // Then add metadata matches
      for (const bookmark of metadataMatchedBookmarks) {
        if (!allBookmarkIds.has(bookmark.id)) {
          allBookmarkIds.add(bookmark.id);
          combinedBookmarks.push(bookmark);
        }
      }

      // Step 4: Prepare prompt for AI
      const promptContent = `
Query: "${query}"

Found ${combinedBookmarks.length} potential bookmark matches.

Bookmark details:
${combinedBookmarks.map((bookmark, index) => `
[${index + 1}] Title: ${bookmark.title}
URL: ${bookmark.url || "N/A"}
Category: ${bookmark.category || "Uncategorized"}
${bookmark.metadata?.summary ? `Summary: ${bookmark.metadata.summary}` : ""}
`).join('\n')}

Based on the user's query and the bookmarks found, please:
1. Identify which bookmarks most likely match what the user is looking for
2. Explain why these are relevant to the query
3. If no exact matches were found, suggest related bookmarks or search refinements
4. Format your response in a clear, readable way listing the most relevant bookmarks first
`;

      // Step 5: Get AI response for bookmark search results
      const response = await aiRequestManager.makeRequest(
        () => retryWithBackoff(
          () => summarizeContent(promptContent, currentLanguage.code),
          {
            maxRetries: 3,
            initialDelay: 1000,
            onRetry: (error, attempt) => {
              console.log(`Retry attempt ${attempt} after error:`, error);
            }
          }
        ),
        `bookmark_search_${query.slice(0, 20)}_${currentLanguage.code}`,
        "I couldn't find any bookmarks matching your query. Try using different keywords or a more specific description."
      );

      return {
        response,
        bookmarks: combinedBookmarks.slice(0, 5).map((b) => ({
          title: b.title,
          url: b.url || "",
          relevance: 1,
        })),
      };
    } catch (error) {
      console.error("Error processing bookmark search:", error);
      throw error;
    }
  };

  // Standard chat query processing
  const processQuery = async (query: string) => {
    try {
      setError(null);
      
      if (isOffline) {
        throw new Error("You're currently offline. Please check your connection and try again.");
      }
      
      if (!isAIAvailable) {
        throw new Error("AI service is currently unavailable. Please try again later.");
      }

      // Check for rate limiting
      const throttleCheck = await aiRequestManager.isThrottled();
      if (throttleCheck.throttled) {
        throw new Error(`Request rate limited: ${throttleCheck.reason || "Too many requests"}`);
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

      // Use the AI request manager for rate limiting and caching
      const response = await aiRequestManager.makeRequest(
        () => retryWithBackoff(
          () => summarizeContent(prompt, currentLanguage.code),
          {
            maxRetries: 3,
            initialDelay: 1000,
            onRetry: (error, attempt) => {
              console.log(`Retry attempt ${attempt} after error:`, error);
            }
          }
        ),
        // Use a cache key based on a simplified version of the prompt
        `chat_${query.slice(0, 20)}_${currentLanguage.code}_${relevantBookmarks.length}_${webResults.length}`,
        // Fallback message if everything fails
        "I'm sorry, I couldn't process your request. Please try again later."
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

    // Save to recent queries
    saveRecentQuery(inputValue);

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
          async () => await processBookmarkSearch(inputValue),
          {
            errorMessage: "Failed to search bookmarks",
            showError: false,
            rethrow: true
          }
        );
      } else {
        result = await withErrorHandling(
          async () => await processQuery(inputValue),
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
        generateSuggestions(messages.concat([userMessage, assistantMessage]));
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

  const generateSuggestions = useCallback((messageList: Message[]) => {
    if (messageList.length === 0) return;
    
    // Generate different suggestions based on the mode
    if (isBookmarkSearchMode) {
      setSuggestions([
        "Find bookmarks about web development",
        "Look for recipe bookmarks with chicken",
        "Find bookmarks with PDF files",
        "Search for bookmarks about machine learning tutorials"
      ]);
      return;
    }
    
    const topics = extractTopicsFromMessages(messageList).slice(0, 3);
    
    // Create follow-up suggestions based on the latest conversation
    const latestUserMessage = [...messageList].reverse().find(m => m.sender === "user");
    const latestAssistantMessage = [...messageList].reverse().find(m => m.sender === "assistant");
    
    if (latestUserMessage && latestAssistantMessage) {
      let newSuggestions: string[] = [];
      
      // Add topic-based suggestions
      if (topics.length > 0) {
        newSuggestions = topics.map(topic => `Tell me more about ${topic}`);
      }
      
      // Add bookmark-related suggestions if bookmarks were mentioned
      if (latestAssistantMessage.bookmarks && latestAssistantMessage.bookmarks.length > 0) {
        newSuggestions.push(
          `Explain the first bookmark in more detail`
        );
      }
      
      // Add general follow-up questions
      if (latestUserMessage.content.toLowerCase().includes("how")) {
        newSuggestions.push("Why is this important?");
      } else if (latestUserMessage.content.toLowerCase().includes("what")) {
        newSuggestions.push("How can I apply this?");
      } else {
        newSuggestions.push("Can you summarize this topic?");
      }
      
      setSuggestions([...new Set(newSuggestions)]);
    }
  }, [isBookmarkSearchMode]);

  useEffect(() => {
    if (messages.length > 1) {
      generateSuggestions(messages);
    }
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
