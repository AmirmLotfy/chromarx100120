
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
  private readonly BOOKMARK_CACHE_KEY = 'bookmark_search_cache';
  private searchCache: Map<string, { results: string[], timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): OptimizedBookmarkStorage {
    if (!this.instance) {
      this.instance = new OptimizedBookmarkStorage();
    }
    return this.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Check if stores exist by trying to get a count
      // If the operation fails, the stores don't exist yet
      try {
        await bookmarkDbService.count(this.BOOKMARKS_STORE);
        await bookmarkDbService.count(this.BOOKMARK_INDEX_STORE);
      } catch (error) {
        console.log('Stores do not exist yet, will be created automatically on first use');
      }
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
      // Clear cache after updates
      this.clearSearchCache();
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  async addBookmarks(bookmarks: ChromeBookmark[]): Promise<void> {
    try {
      if (bookmarks.length === 0) return;
      
      const indices = bookmarks.map(bookmark => this.createBookmarkIndex(bookmark));
      
      await Promise.all([
        bookmarkDbService.bulkPut(this.BOOKMARKS_STORE, bookmarks),
        bookmarkDbService.bulkPut(this.BOOKMARK_INDEX_STORE, indices)
      ]);
      
      // Clear cache after bulk updates
      this.clearSearchCache();
    } catch (error) {
      console.error('Error adding bookmarks in bulk:', error);
      throw error;
    }
  }

  private clearSearchCache(): void {
    this.searchCache.clear();
  }

  private getCachedSearch(query: string): string[] | null {
    const cached = this.searchCache.get(query);
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.searchCache.delete(query);
      return null;
    }
    
    return cached.results;
  }

  private setCachedSearch(query: string, results: string[]): void {
    // Limit cache size to 100 entries
    if (this.searchCache.size >= 100) {
      // Find oldest entry and remove it
      let oldestQuery = '';
      let oldestTime = Date.now();
      
      for (const [key, value] of this.searchCache.entries()) {
        if (value.timestamp < oldestTime) {
          oldestTime = value.timestamp;
          oldestQuery = key;
        }
      }
      
      if (oldestQuery) {
        this.searchCache.delete(oldestQuery);
      }
    }
    
    this.searchCache.set(query, {
      results,
      timestamp: Date.now()
    });
  }

  async searchBookmarks(query: string): Promise<ChromeBookmark[]> {
    if (!query.trim()) return [];

    try {
      // Check cache first
      const cachedIds = this.getCachedSearch(query);
      if (cachedIds) {
        // Get full bookmarks for cached IDs
        const bookmarks = await Promise.all(
          cachedIds.map(id => 
            bookmarkDbService.get<ChromeBookmark>(this.BOOKMARKS_STORE, id)
          )
        );
        return bookmarks.filter((bookmark): bookmark is ChromeBookmark => bookmark !== null);
      }
      
      const indices = await bookmarkDbService.getAll<BookmarkIndex>(this.BOOKMARK_INDEX_STORE);
      const queryWords = query.toLowerCase().trim().split(/\s+/);
      
      // Score and filter indices
      const matchingResults = indices
        .map(index => {
          let score = 0;
          
          for (const word of queryWords) {
            // Title is most important
            if (index.title.includes(word)) {
              score += 10;
              // Exact title match or starts with is even more important
              if (index.title === word) score += 5;
              if (index.title.startsWith(word + ' ')) score += 3;
            }
            
            // URL is next most important
            if (index.url?.includes(word)) score += 8;
            
            // Category
            if (index.category?.includes(word)) score += 6;
            
            // Content is less important but still relevant
            if (index.content?.includes(word)) score += 3;
            
            // Tags have higher weight than content
            if (index.tags?.some(tag => tag.includes(word))) score += 7;
          }
          
          return { id: index.id, score };
        })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(result => result.id);

      // Cache the results
      this.setCachedSearch(query, matchingResults);

      // Get full bookmarks for matching IDs
      const bookmarks = await Promise.all(
        matchingResults.map(id => 
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
      this.clearSearchCache();
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
      this.clearSearchCache();
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
  
  async getBookmarkCount(): Promise<number> {
    try {
      return await bookmarkDbService.count(this.BOOKMARKS_STORE);
    } catch (error) {
      console.error('Error getting bookmark count:', error);
      return 0;
    }
  }
}

export const optimizedBookmarkStorage = OptimizedBookmarkStorage.getInstance();
