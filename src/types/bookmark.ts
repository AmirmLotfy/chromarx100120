/// <reference types="chrome"/>

export interface ChromeBookmark extends chrome.bookmarks.BookmarkTreeNode {
  category?: string;
}