
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

/**
 * Service for interacting with Chrome's bookmark API
 */
export const chromeBookmarkService = {
  /**
   * Check if Chrome bookmark API is available
   */
  isAvailable(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.bookmarks;
  },

  /**
   * Get all bookmarks from Chrome
   */
  async getAllBookmarks(): Promise<ChromeBookmark[]> {
    try {
      if (!this.isAvailable()) {
        toast.error("Chrome bookmarks API not available");
        return [];
      }
      
      const chromeTrees = await chrome.bookmarks.getTree();
      return this.flattenBookmarkTree(chromeTrees);
    } catch (error) {
      console.error("Error getting Chrome bookmarks:", error);
      toast.error("Failed to get Chrome bookmarks");
      return [];
    }
  },

  /**
   * Create a new bookmark folder in Chrome
   */
  async createFolder(name: string, parentId?: string): Promise<ChromeBookmark | null> {
    try {
      if (!this.isAvailable()) {
        // Fallback for non-Chrome environments or when Chrome API is not available
        const newFolder: ChromeBookmark = {
          id: uuidv4(),
          title: name,
          dateAdded: Date.now(),
          children: []
        };
        toast.success(`Folder "${name}" created (simulated)`);
        return newFolder;
      }
      
      const folder = await chrome.bookmarks.create({
        title: name,
        parentId: parentId || "1" // Default to bookmarks bar if no parent specified
      });
      
      return {
        id: folder.id,
        title: folder.title,
        parentId: folder.parentId,
        dateAdded: folder.dateAdded,
        children: []
      };
    } catch (error) {
      console.error("Error creating bookmark folder:", error);
      toast.error("Failed to create bookmark folder");
      return null;
    }
  },

  /**
   * Create a new bookmark in Chrome
   */
  async createBookmark(title: string, url: string, parentId?: string): Promise<ChromeBookmark | null> {
    try {
      if (!this.isAvailable()) {
        // Fallback for non-Chrome environments
        const newBookmark: ChromeBookmark = {
          id: uuidv4(),
          title,
          url,
          dateAdded: Date.now()
        };
        toast.success(`Bookmark "${title}" created (simulated)`);
        return newBookmark;
      }
      
      const bookmark = await chrome.bookmarks.create({
        title,
        url,
        parentId: parentId || "1" // Default to bookmarks bar if no parent specified
      });
      
      return {
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        parentId: bookmark.parentId,
        dateAdded: bookmark.dateAdded
      };
    } catch (error) {
      console.error("Error creating bookmark:", error);
      toast.error("Failed to create bookmark");
      return null;
    }
  },

  /**
   * Update a bookmark in Chrome
   */
  async updateBookmark(id: string, changes: { title?: string; url?: string }): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        toast.success(`Bookmark updated (simulated)`);
        return true;
      }
      
      await chrome.bookmarks.update(id, changes);
      return true;
    } catch (error) {
      console.error("Error updating bookmark:", error);
      toast.error("Failed to update bookmark");
      return false;
    }
  },

  /**
   * Remove a bookmark from Chrome
   */
  async removeBookmark(id: string): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        toast.success(`Bookmark removed (simulated)`);
        return true;
      }
      
      await chrome.bookmarks.remove(id);
      return true;
    } catch (error) {
      console.error("Error removing bookmark:", error);
      toast.error("Failed to remove bookmark");
      return false;
    }
  },

  /**
   * Remove a bookmark folder and all its contents from Chrome
   */
  async removeBookmarkTree(id: string): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        toast.success(`Bookmark folder removed (simulated)`);
        return true;
      }
      
      await chrome.bookmarks.removeTree(id);
      return true;
    } catch (error) {
      console.error("Error removing bookmark tree:", error);
      toast.error("Failed to remove bookmark folder");
      return false;
    }
  },

  /**
   * Get a specific bookmark from Chrome
   */
  async getBookmark(id: string): Promise<ChromeBookmark | null> {
    try {
      if (!this.isAvailable()) {
        return null;
      }
      
      const [bookmark] = await chrome.bookmarks.get(id);
      
      if (!bookmark) {
        return null;
      }
      
      return {
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        parentId: bookmark.parentId,
        dateAdded: bookmark.dateAdded
      };
    } catch (error) {
      console.error("Error getting bookmark:", error);
      return null;
    }
  },

  /**
   * Convert Chrome bookmark tree to flat array of ChromeBookmark objects
   */
  private flattenBookmarkTree(nodes: chrome.bookmarks.BookmarkTreeNode[], category = "Chrome"): ChromeBookmark[] {
    let bookmarks: ChromeBookmark[] = [];
    
    for (const node of nodes) {
      // If node has children, it's a folder
      if (node.children) {
        const subCategory = node.title || category;
        
        // Add the folder itself
        bookmarks.push({
          id: node.id,
          title: node.title,
          parentId: node.parentId,
          dateAdded: node.dateAdded,
          children: this.flattenBookmarkTree(node.children, subCategory),
          category: category,
        });
        
        // Add all children with the folder's title as category
        bookmarks = bookmarks.concat(this.flattenBookmarkTree(node.children, subCategory));
      } 
      // If node has a URL, it's a bookmark
      else if (node.url) {
        bookmarks.push({
          id: node.id,
          title: node.title,
          url: node.url,
          parentId: node.parentId,
          dateAdded: node.dateAdded,
          category: category,
        });
      }
    }
    
    return bookmarks;
  }
};
