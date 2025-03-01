
import { Message, Conversation } from "@/types/chat";
import { storage } from "@/services/storageService";
import { toast } from "sonner";

export const STORAGE_KEY = 'chromarx_chat_history';
export const CONVERSATIONS_KEY = 'chromarx_conversations';
export const RECENT_QUERIES_KEY = 'chromarx_recent_queries';
export const MAX_RECENT_QUERIES = 5;

export const saveRecentQuery = async (
  query: string, 
  recentQueries: string[], 
  setRecentQueries: (queries: string[]) => void
) => {
  try {
    // Don't save duplicate or empty queries
    if (!query.trim() || recentQueries.includes(query)) return;
    
    const updatedQueries = [query, ...recentQueries].slice(0, MAX_RECENT_QUERIES);
    setRecentQueries(updatedQueries);
    await storage.set(RECENT_QUERIES_KEY, updatedQueries);
  } catch (error) {
    console.error('Error saving recent query:', error);
  }
};

export const saveChatHistory = async (
  newMessages: Message[], 
  chatHistory: Conversation[], 
  setChatHistory: (history: Conversation[]) => void
) => {
  if (newMessages.length === 0) return;
  
  try {
    // Create a conversation object from the messages
    const newConversation: Conversation = {
      id: Date.now().toString(),
      name: `Chat ${new Date().toLocaleDateString()}`,
      messages: newMessages,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedHistory = [newConversation, ...chatHistory].slice(0, 10);
    await storage.set(STORAGE_KEY, updatedHistory);
    setChatHistory(updatedHistory);
  } catch (error) {
    console.error('Error saving chat history:', error);
    toast.error('Failed to save chat history');
  }
};

export const saveConversation = async (
  name: string, 
  category: string,
  messages: Message[],
  activeConversation: Conversation | undefined,
  conversations: Conversation[],
  setConversations: (conversations: Conversation[]) => void,
  setActiveConversation: (conversation: Conversation | undefined) => void
) => {
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
};

export const updateConversation = async (
  conversation: Conversation,
  conversations: Conversation[],
  setConversations: (conversations: Conversation[]) => void,
  activeConversation: Conversation | undefined,
  setActiveConversation: (conversation: Conversation | undefined) => void
) => {
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
};
