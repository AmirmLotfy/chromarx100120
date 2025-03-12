
import { ChromeBookmark } from "@/types/bookmark";
import { bookmarkDbService } from "./indexedDbService";

interface BookmarkIndex {
  id: string;
  title: string;
  url?: string;
  category?: string;
  content?: string;
  tags?: string[];
  dateAdded: number;
}

class OptimizedBookmarkStorage {
  private static instance: OptimizedBookmarkStorage;
  private readonly BOOKMARKS_STORE = 'bookmarks';
  private readonly BOOKMARK_INDEX_STORE = 'bookmark_indices';

  private constructor() {}

  static getInstance(): OptimizedBookmarkStorage {
    if (!this.instance) {
      this.instance = new OptimizedBookmarkStorage();
    }
    return this.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Ensure stores exist
      await bookmarkDbService.createStore(this.BOOKMARKS_STORE);
      await bookmarkDbService.createStore(this.BOOKMARK_INDEX_STORE);
    } catch (error) {
      console.error('Error initializing bookmark storage:', error);
      throw error;
    }
  }

  private createBookmarkIndex(bookmark: ChromeBookmark): BookmarkIndex {
    return {
      id: bookmark.id,
      title: bookmark.title.toLowerCase(),
      url: bookmark.url?.toLowerCase(),
      category: bookmark.category?.toLowerCase(),
      content: bookmark.content?.toLowerCase(),
      tags: bookmark.tags?.map(tag => tag.toLowerCase()),
      dateAdded: bookmark.dateAdded || Date.now()
    };
  }

  async addBookmark(bookmark: ChromeBookmark): Promise<void> {
    try {
      await Promise.all([
        bookmarkDbService.put(this.BOOKMARKS_STORE, bookmark),
        bookmarkDbService.put(this.BOOKMARK_INDEX_STORE, this.createBookmarkIndex(bookmark))
      ]);
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  async addBookmarks(bookmarks: ChromeBookmark[]): Promise<void> {
    try {
      const indices = bookmarks.map(bookmark => this.createBookmarkIndex(bookmark));
      
      await Promise.all([
        bookmarkDbService.bulkPut(this.BOOKMARKS_STORE, bookmarks),
        bookmarkDbService.bulkPut(this.BOOKMARK_INDEX_STORE, indices)
      ]);
    } catch (error) {
      console.error('Error adding bookmarks in bulk:', error);
      throw error;
    }
  }

  async searchBookmarks(query: string): Promise<ChromeBookmark[]> {
    if (!query.trim()) return [];

    try {
      const indices = await bookmarkDbService.getAll<BookmarkIndex>(this.BOOKMARK_INDEX_STORE);
      const queryWords = query.toLowerCase().trim().split(/\s+/);
      
      // Score and filter indices
      const matchingIds = indices
        .map(index => {
          let score = 0;
          
          for (const word of queryWords) {
            if (index.title.includes(word)) score += 10;
            if (index.url?.includes(word)) score += 8;
            if (index.category?.includes(word)) score += 6;
            if (index.content?.includes(word)) score += 3;
            if (index.tags?.some(tag => tag.includes(word))) score += 7;
          }
          
          return { id: index.id, score };
        })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(result => result.id);

      // Get full bookmarks for matching IDs
      const bookmarks = await Promise.all(
        matchingIds.map(id => 
          bookmarkDbService.get<ChromeBookmark>(this.BOOKMARKS_STORE, id)
        )
      );

      return bookmarks.filter((bookmark): bookmark is ChromeBookmark => bookmark !== null);
    } catch (error) {
      console.error('Error searching bookmarks:', error);
      return [];
    }
  }

  async updateBookmark(bookmark: ChromeBookmark): Promise<void> {
    try {
      await Promise.all([
        bookmarkDbService.put(this.BOOKMARKS_STORE, bookmark),
        bookmarkDbService.put(this.BOOKMARK_INDEX_STORE, this.createBookmarkIndex(bookmark))
      ]);
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw error;
    }
  }

  async deleteBookmark(id: string): Promise<void> {
    try {
      await Promise.all([
        bookmarkDbService.delete(this.BOOKMARKS_STORE, id),
        bookmarkDbService.delete(this.BOOKMARK_INDEX_STORE, id)
      ]);
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw error;
    }
  }

  async getAllBookmarks(): Promise<ChromeBookmark[]> {
    try {
      return await bookmarkDbService.getAll<ChromeBookmark>(this.BOOKMARKS_STORE);
    } catch (error) {
      console.error('Error getting all bookmarks:', error);
      return [];
    }
  }
}

export const optimizedBookmarkStorage = OptimizedBookmarkStorage.getInstance();
