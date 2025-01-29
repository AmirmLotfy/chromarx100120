import { BookmarkTreeNode } from "chrome";

export interface ChromeBookmark extends Omit<BookmarkTreeNode, 'children'> {
  id: string;
  title: string;
  url?: string;
  dateAdded?: number;
  category?: string;
}