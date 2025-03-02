import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { Message, Conversation, ConversationCategory } from "@/types/chat";
import { ConversationService } from "@/services/conversationService";
import { useAuth } from "@/hooks/useAuth"; // Assuming you have an auth hook

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
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const { generateResponse } = useAI();
  const { user } = useAuth(); // Get current user

  // Load chat history from Supabase
  useEffect(() => {
    const loadConversations = async () => {
      if (user) {
        const conversations = await ConversationService.getConversations(false);
        setChatHistory(conversations);
        
        // Load archived conversations separately
        const archived = await ConversationService.getConversations(true);
        setArchivedConversations(archived);
      }
    };
    
    loadConversations();
  }, [user]);

  // Load chat session
  const loadChatSession = useCallback((conversation: Conversation) => {
    setMessages(conversation.messages);
    setActiveConversation(conversation);
    
    // Mark messages as read when loading a conversation
    if (conversation.id) {
      ConversationService.markMessagesAsRead(conversation.id);
    }
  }, []);

  // Handle sending a message
  const handleSendMessage = async (messageContent: string) => {
    if (isProcessing || !isAIAvailable) return;

    // Check if user has reached their AI request limit
    const { useSubscription } = await import('@/hooks/use-subscription');
    const { incrementUsage, hasReachedLimit } = useSubscription();
    
    if (hasReachedLimit('aiRequests')) {
      toast({
        title: "AI Request Limit Reached",
        description: "You've reached your AI request limit. Please upgrade your plan for more AI interactions.",
        variant: "destructive",
        action: {
          onClick: () => window.location.href = "/subscription"
        }
      });
      return;
    }

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
        // Increment AI request usage count
        await incrementUsage('aiRequests');
        
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
        await updateChatHistory(userMessage, assistantMessage);
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
  const updateChatHistory = async (userMessage: Message, assistantMessage: Message) => {
    if (!user) return;

    try {
      if (activeConversation) {
        // Update existing conversation
        const updatedMessages = [...activeConversation.messages, userMessage, assistantMessage];
        const updatedConversation = {
          ...activeConversation,
          messages: updatedMessages,
          updatedAt: Date.now()
        };
        
        // Add messages to database
        await ConversationService.addMessage(activeConversation.id, userMessage);
        await ConversationService.addMessage(activeConversation.id, assistantMessage);
        
        // Update conversation in state
        setChatHistory(prevHistory => 
          prevHistory.map(convo => 
            convo.id === activeConversation.id ? updatedConversation : convo
          )
        );
        
        setActiveConversation(updatedConversation);
      } else {
        // Create new conversation
        const convoName = userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? "..." : "");
        const newConversation = await ConversationService.createConversation(
          convoName,
          "General", 
          [INITIAL_WELCOME_MESSAGE, userMessage, assistantMessage]
        );
        
        if (newConversation) {
          setChatHistory(prevHistory => [newConversation, ...prevHistory]);
          setActiveConversation(newConversation);
        }
      }
    } catch (error) {
      console.error("Error updating chat history:", error);
      toast({
        title: "Error",
        description: "Failed to save conversation",
        variant: "destructive",
      });
    }
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

    if (activeConversation?.id) {
      ConversationService.markMessagesAsRead(activeConversation.id);
      
      // Update conversation in state
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
    }
  }, [activeConversation, chatHistory]);

  // Archive conversation
  const archiveConversation = async (conversationId: string) => {
    try {
      const success = await ConversationService.archiveConversation(conversationId);
      if (success) {
        // Move from active to archived list
        const conversation = chatHistory.find(c => c.id === conversationId);
        if (conversation) {
          setArchivedConversations(prev => [conversation, ...prev]);
          setChatHistory(prev => prev.filter(c => c.id !== conversationId));
          
          // Clear active conversation if it was archived
          if (activeConversation?.id === conversationId) {
            clearChat();
          }
        }
        toast({ 
          title: "Success", 
          description: "Conversation archived"
        });
      }
    } catch (error) {
      console.error("Error archiving conversation:", error);
      toast({
        title: "Error",
        description: "Failed to archive conversation",
        variant: "destructive",
      });
    }
  };

  // Restore archived conversation
  const restoreConversation = async (conversationId: string) => {
    try {
      const success = await ConversationService.restoreConversation(conversationId);
      if (success) {
        // Move from archived to active list
        const conversation = archivedConversations.find(c => c.id === conversationId);
        if (conversation) {
          setChatHistory(prev => [conversation, ...prev]);
          setArchivedConversations(prev => prev.filter(c => c.id !== conversationId));
        }
        toast({ 
          title: "Success", 
          description: "Conversation restored"
        });
      }
    } catch (error) {
      console.error("Error restoring conversation:", error);
      toast({
        title: "Error",
        description: "Failed to restore conversation",
        variant: "destructive",
      });
    }
  };

  // Delete conversation permanently
  const deleteConversation = async (conversationId: string) => {
    try {
      const success = await ConversationService.deleteConversation(conversationId);
      if (success) {
        // Remove from either active or archived list
        setChatHistory(prev => prev.filter(c => c.id !== conversationId));
        setArchivedConversations(prev => prev.filter(c => c.id !== conversationId));
        
        // Clear active conversation if it was deleted
        if (activeConversation?.id === conversationId) {
          clearChat();
        }
        
        toast({ 
          title: "Success", 
          description: "Conversation deleted"
        });
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  // Update conversation category
  const updateConversationCategory = async (conversationId: string, category: ConversationCategory) => {
    try {
      const success = await ConversationService.updateCategory(conversationId, category);
      if (success) {
        // Update in state
        setChatHistory(prev => prev.map(c => 
          c.id === conversationId ? { ...c, category } : c
        ));
        
        // Update active conversation if needed
        if (activeConversation?.id === conversationId) {
          setActiveConversation(prev => prev ? { ...prev, category } : undefined);
        }
        
        toast({ 
          title: "Success", 
          description: `Conversation moved to ${category}`
        });
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  // Toggle conversation pinned status
  const togglePinned = async (conversationId: string) => {
    const conversation = chatHistory.find(c => c.id === conversationId);
    if (!conversation) return;
    
    const newPinnedState = !conversation.pinned;
    
    try {
      const success = await ConversationService.togglePinned(conversationId, newPinnedState);
      if (success) {
        // Update in state
        setChatHistory(prev => prev.map(c => 
          c.id === conversationId ? { ...c, pinned: newPinnedState } : c
        ));
        
        // Update active conversation if needed
        if (activeConversation?.id === conversationId) {
          setActiveConversation(prev => prev ? { ...prev, pinned: newPinnedState } : undefined);
        }
        
        toast({ 
          title: "Success", 
          description: newPinnedState ? "Conversation pinned" : "Conversation unpinned"
        });
      }
    } catch (error) {
      console.error("Error toggling pinned status:", error);
      toast({
        title: "Error",
        description: "Failed to update pinned status",
        variant: "destructive",
      });
    }
  };

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
    archivedConversations,
    showArchived,
    setShowArchived,
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
    archiveConversation,
    restoreConversation,
    deleteConversation,
    updateConversationCategory,
    togglePinned,
  };
};
