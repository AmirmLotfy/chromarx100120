
export type MessageSender = 'user' | 'assistant';
export type ConversationCategory = 'General' | 'Work' | 'Research' | 'Personal' | 'Bookmarks' | string;

export interface Message {
  id: string;
  content: string;
  sender: MessageSender;
  timestamp: number;
  isRead: boolean;
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
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  bookmarkContext?: string;
  isBookmarkSearch?: boolean;
  category: ConversationCategory;
  archived?: boolean;
}
