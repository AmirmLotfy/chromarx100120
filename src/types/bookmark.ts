
/// <reference types="chrome"/>

export interface ChromeBookmark extends Omit<chrome.bookmarks.BookmarkTreeNode, 'children'> {
  id: string;
  title: string;
  url?: string;
  dateAdded?: number;
  category?: string;
  content?: string;
  version?: number; // Added version field as optional
}
