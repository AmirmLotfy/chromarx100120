
export type ConversationCategory = "General" | "Work" | "Research" | "Personal" | "Bookmarks";

export interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: number;
  isRead?: boolean;
  bookmarks?: any;
  webResults?: any;
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
  archived?: boolean;
}
