
import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { Message, Conversation, ConversationCategory } from "@/types/chat";

// Mock function for getSuggestedQuestions until we implement it properly
const getSuggestedQuestions = (text: string): string[] => {
  return [
    "Tell me more about this topic",
    "How does this compare to other solutions?",
    "Can you provide examples?"
  ];
};

// Mock AI hook until we implement it properly
const useAI = () => {
  const generateResponse = async (prompt: string, isBookmarkSearch: boolean) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      response: `This is a mock response to: "${prompt}"${isBookmarkSearch ? " (in bookmark search mode)" : ""}`,
      bookmarks: isBookmarkSearch ? [
        { title: "Example Bookmark", url: "https://example.com", relevanceScore: 0.85 }
      ] : [],
      webResults: []
    };
  };
  
  return { generateResponse };
};

const INITIAL_WELCOME_MESSAGE = {
  id: uuidv4(),
  content: "Hello! I'm here to assist you. Feel free to ask me anything about your bookmarks or any other topic.",
  sender: "assistant" as const,
  timestamp: Date.now(),
  isRead: true
};

export const useChatState = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_WELCOME_MESSAGE]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [isBookmarkSearchMode, setIsBookmarkSearchMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [activeConversation, setActiveConversation] = useState<Conversation | undefined>(undefined);
  const [chatHistory, setChatHistory] = useState<Conversation[]>([]);
  const { generateResponse } = useAI();

  // Function to use localStorage for chat history
  const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(error);
        return initialValue;
      }
    });
  
    const setValue = (value: T) => {
      try {
        setStoredValue(value);
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(error);
      }
    };
  
    return [storedValue, setValue];
  };

  // Initialize chat history from localStorage
  const [storedChatHistory, setStoredChatHistory] = useLocalStorage<Conversation[]>('chatHistory', []);
  
  // Sync local state with stored history
  useEffect(() => {
    setChatHistory(storedChatHistory);
  }, [storedChatHistory]);

  // Function to save conversations to local storage
  const saveConversationsToStorage = (conversations: Conversation[]) => {
    setStoredChatHistory(conversations);
  };

  // Load chat session
  const loadChatSession = useCallback((messages: Message[]) => {
    setMessages(messages);
    // Find the corresponding conversation in chatHistory and set it as active
    const conversation = chatHistory.find(convo => 
      convo.messages.length > 0 && 
      messages.length > 0 && 
      convo.messages[0].id === messages[0].id
    );
    setActiveConversation(conversation);
  }, [chatHistory]);

  // Handle sending a message
  const handleSendMessage = async (messageContent: string) => {
    if (isProcessing || !isAIAvailable) return;

    const userMessage: Message = {
      id: uuidv4(),
      content: messageContent,
      sender: "user",
      timestamp: Date.now(),
      isRead: true
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsProcessing(true);
    setError(null);

    try {
      const response = await generateResponse(messageContent, isBookmarkSearchMode);

      if (response) {
        const assistantMessage: Message = {
          id: uuidv4(),
          content: response.response,
          sender: "assistant",
          timestamp: Date.now(),
          bookmarks: response.bookmarks,
          webResults: response.webResults,
          isRead: false
        };

        setMessages(prevMessages => [...prevMessages, assistantMessage]);
        setSuggestions(getSuggestedQuestions(response.response));

        // Update or create chat history
        updateChatHistory(userMessage, assistantMessage);
      } else {
        setError(new Error("Failed to generate response."));
        toast({
          title: "Error",
          description: "Failed to generate response.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      console.error("Error in handleSendMessage:", e);
      setError(new Error(e.message || "An unexpected error occurred."));
      toast({
        title: "Error",
        description: e.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }

    // Save the query to recent queries
    if (!recentQueries.includes(messageContent)) {
      setRecentQueries(prevQueries => [messageContent, ...prevQueries.slice(0, 4)]);
    }
  };

  // Clear chat messages
  const clearChat = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setSuggestions([]);
    setActiveConversation(undefined);
  };

  // Retry sending the last message
  const retryLastMessage = async () => {
    if (isProcessing || messages.length === 0) return;

    const lastMessage = messages.slice(-1)[0];
    if (lastMessage.sender === "user") {
      setMessages(prevMessages => prevMessages.slice(0, -1));
      await handleSendMessage(lastMessage.content);
    }
  };

  // Check connection status
  const checkConnection = async () => {
    setIsOffline(false);
    setIsAIAvailable(true);
    try {
      const response = await fetch("/api/ping");
      const data = await response.json();
      setIsAIAvailable(data.pong === "ok");
    } catch (e) {
      setIsOffline(true);
      setIsAIAvailable(false);
    }
  };

  // Update chat history
  const updateChatHistory = (userMessage: Message, assistantMessage: Message) => {
    const newConversationEntry: Conversation = {
      id: uuidv4(),
      name: userMessage.content.substring(0, 50),
      messages: [userMessage, assistantMessage],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      category: "General"
    };

    setChatHistory(prevHistory => {
      let updatedHistory;

      if (activeConversation) {
        // Update existing conversation
        updatedHistory = prevHistory.map(convo => {
          if (convo.id === activeConversation.id) {
            return {
              ...convo,
              messages: [...convo.messages, userMessage, assistantMessage],
              updatedAt: Date.now()
            };
          }
          return convo;
        });
      } else {
        // Add new conversation
        updatedHistory = [newConversationEntry, ...prevHistory];
        setActiveConversation(newConversationEntry);
      }

      // Save to storage
      saveConversationsToStorage(updatedHistory);
      return updatedHistory;
    });
  };

  // Toggle bookmark search mode
  const toggleBookmarkSearchMode = () => {
    setIsBookmarkSearchMode(prevMode => !prevMode);
  };

  // Mark messages as read
  const markMessagesAsRead = useCallback(() => {
    setMessages((prevMessages) => 
      prevMessages.map(message => ({
        ...message,
        isRead: true
      }))
    );

    if (activeConversation) {
      const updatedHistory = chatHistory.map(convo => {
        if (convo.id === activeConversation.id) {
          return {
            ...convo,
            messages: convo.messages.map(msg => ({
              ...msg,
              isRead: true
            }))
          };
        }
        return convo;
      });
      setChatHistory(updatedHistory);
      
      // Save to storage
      saveConversationsToStorage(updatedHistory);
    }
  }, [activeConversation, chatHistory]);

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
    checkConnection,
    recentQueries,
    activeConversation,
    isBookmarkSearchMode,
    toggleBookmarkSearchMode,
    markMessagesAsRead,
  };
};
