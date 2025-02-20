
import { useState, useEffect } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";

export const useBookmarkState = () => {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const tree = await chrome.bookmarks.getTree();
      const flattenedBookmarks = flattenBookmarkTree(tree);
      setBookmarks(flattenedBookmarks);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const flattenBookmarkTree = (nodes: chrome.bookmarks.BookmarkTreeNode[]): ChromeBookmark[] => {
    const bookmarks: ChromeBookmark[] = [];
    
    const traverse = (node: chrome.bookmarks.BookmarkTreeNode) => {
      if (node.url) {
        bookmarks.push({
          id: node.id,
          title: node.title,
          url: node.url,
          dateAdded: node.dateAdded,
          parentId: node.parentId
        });
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    nodes.forEach(traverse);
    return bookmarks;
  };

  return {
    bookmarks,
    setBookmarks,
    selectedBookmarks,
    setSelectedBookmarks,
    loading,
    refreshBookmarks: loadBookmarks
  };
};
