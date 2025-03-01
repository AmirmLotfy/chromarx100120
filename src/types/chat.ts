
export interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  bookmarks?: {
    title: string;
    url: string;
    relevance: number;
  }[];
  webResults?: {
    title: string;
    url: string;
  }[];
}

export interface Conversation {
  id: string;
  name: string;
  category?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  pinned?: boolean;
  bookmarkContext?: string[];
  isBookmarkSearch?: boolean;
}

export type ConversationCategory = "General" | "Work" | "Research" | "Personal" | "Bookmarks";
