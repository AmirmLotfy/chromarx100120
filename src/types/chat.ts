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