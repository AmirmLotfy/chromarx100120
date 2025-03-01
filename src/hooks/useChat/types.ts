
import { Message, Conversation } from "@/types/chat";

export interface ChatHistoryState {
  messages: Message[];
  isProcessing: boolean;
  error: Error | null;
  isOffline: boolean;
  isAIAvailable: boolean;
  suggestions: string[];
  isHistoryOpen: boolean;
  isConversationManagerOpen: boolean;
  chatHistory: Conversation[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  recentQueries: string[];
  activeConversation: Conversation | undefined;
  conversations: Conversation[];
  isBookmarkSearchMode: boolean;
}

export interface ChatActionHandlers {
  handleSendMessage: (inputValue: string) => Promise<void>;
  clearChat: () => void;
  loadChatSession: (sessionMessages: Message[]) => void;
  retryLastMessage: () => Promise<void>;
  checkConnection: () => Promise<void>;
  saveConversation: (name: string, category: string) => Promise<void>;
  updateConversation: (conversation: Conversation) => Promise<void>;
  toggleBookmarkSearchMode: () => void;
  setIsHistoryOpen: (isOpen: boolean) => void;
  setConversationManagerOpen: (isOpen: boolean) => void;
}

export interface BookmarkSearchResult {
  response: string;
  bookmarks: {
    title: string;
    url: string;
    relevance: number;
  }[];
  webResults?: {
    title: string;
    url: string;
  }[];
}

export interface QueryResult extends BookmarkSearchResult {
  webResults: {
    title: string;
    url: string;
  }[];
}
