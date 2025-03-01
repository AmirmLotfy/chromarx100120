
export interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp?: number;
  isRead?: boolean;
  bookmarks?: {
    title: string;
    url: string;
    relevanceScore?: number;
  }[];
  webResults?: {
    title: string;
    url: string;
  }[];
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  bookmarkContext?: string[];
  isBookmarkSearch?: boolean;
  category?: ConversationCategory;
}

export type ConversationCategory = "General" | "Work" | "Research" | "Personal" | "Bookmarks";
