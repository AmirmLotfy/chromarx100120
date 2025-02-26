
/// <reference types="chrome"/>

export interface ChromeBookmark extends Omit<chrome.bookmarks.BookmarkTreeNode, 'children'> {
  id: string;
  title: string;
  url?: string;
  dateAdded?: number;
  category?: string;
  content?: string;
  version?: number;
  preview?: {
    thumbnail?: string;
    description?: string;
    favicon?: string;
    ogImage?: string;
    siteName?: string;
  };
  metadata?: {
    lastVisited?: number;
    visitCount?: number;
    tags?: string[];
  };
}
