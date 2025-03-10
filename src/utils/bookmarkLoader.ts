
import { ChromeBookmark } from "@/types/bookmark";
import { chromeDb } from "@/lib/chrome-storage";
import { toast } from "sonner";

// Constants for optimization
const BATCH_SIZE = 50;
const MAX_INITIAL_LOAD = 100;
const THROTTLE_DELAY = 300;

/**
 * Efficient bookmark loader with progressive loading and advanced caching
 */
export class BookmarkLoader {
  private bookmarkCache: Map<string, ChromeBookmark> = new Map();
  private categoryCache: Map<string, string> = new Map();
  private loadingPromise: Promise<ChromeBookmark[]> | null = null;
  private isInitialized = false;

  /**
   * Initialize the loader - preload essential data
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Preload category cache
      const categoryKeys = await chromeDb.keys();
      for (const key of categoryKeys) {
        if (key.startsWith('bookmark-category-')) {
          const bookmarkId = key.replace('bookmark-category-', '');
          const category = await chromeDb.get<string>(key);
          if (category) this.categoryCache.set(bookmarkId, category);
        }
      }
      
      this.isInitialized = true;
      console.log('BookmarkLoader initialized with', this.categoryCache.size, 'cached categories');
    } catch (error) {
      console.error('Error initializing BookmarkLoader:', error);
    }
  }

  /**
   * Load bookmarks with progressive loading
   * @param onProgress Progress callback
   * @param onBatchComplete Batch complete callback
   */
  async loadBookmarks(
    onProgress?: (progress: number) => void,
    onBatchComplete?: (bookmarks: ChromeBookmark[]) => void
  ): Promise<ChromeBookmark[]> {
    // Return existing promise if already loading
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this._loadBookmarksInternal(onProgress, onBatchComplete);
    
    try {
      return await this.loadingPromise;
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * Internal implementation of bookmark loading
   */
  private async _loadBookmarksInternal(
    onProgress?: (progress: number) => void,
    onBatchComplete?: (bookmarks: ChromeBookmark[]) => void
  ): Promise<ChromeBookmark[]> {
    try {
      // First try to get cached bookmarks for immediate display
      const cached = await this.getCachedBookmarks();
      if (cached && cached.length > 0) {
        // If we have cached bookmarks, return them immediately
        // and continue loading in the background
        setTimeout(() => this.refreshBookmarksInBackground(onProgress, onBatchComplete), 100);
        return cached;
      }

      // No cache, do a full load
      if (!chrome.bookmarks) {
        console.warn('Chrome bookmarks API not available');
        return [];
      }

      const allBookmarks = await chrome.bookmarks.getRecent(2000);
      const processedBookmarks: ChromeBookmark[] = [];
      
      // Process in batches
      for (let i = 0; i < allBookmarks.length; i += BATCH_SIZE) {
        const batchStartTime = performance.now();
        const batch = allBookmarks.slice(i, i + BATCH_SIZE);
        const batchResults = await this.processBatch(batch);
        
        processedBookmarks.push(...batchResults);
        
        if (onProgress) {
          const progress = Math.min(100, Math.round((i + batch.length) / allBookmarks.length * 100));
          onProgress(progress);
        }
        
        if (onBatchComplete && batchResults.length > 0) {
          onBatchComplete(batchResults);
        }
        
        // Add delay between batches to avoid UI blocking
        const batchProcessTime = performance.now() - batchStartTime;
        if (batchProcessTime < THROTTLE_DELAY) {
          await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY - batchProcessTime));
        }
      }

      // Cache the results
      await this.setCachedBookmarks(processedBookmarks);
      return processedBookmarks;
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      toast.error('Failed to load bookmarks');
      return [];
    }
  }

  /**
   * Process a batch of bookmarks
   */
  private async processBatch(batch: chrome.bookmarks.BookmarkTreeNode[]): Promise<ChromeBookmark[]> {
    const processedBatch: ChromeBookmark[] = [];
    
    for (const bookmark of batch) {
      try {
        // Skip invalid bookmarks
        if (!bookmark.id) continue;
        
        // Use cached data if available
        const cachedBookmark = this.bookmarkCache.get(bookmark.id);
        if (cachedBookmark) {
          processedBatch.push(cachedBookmark);
          continue;
        }
        
        // Process new bookmark
        const category = this.categoryCache.get(bookmark.id) || await chromeDb.get<string>(`bookmark-category-${bookmark.id}`);
        
        // If category found, cache it
        if (category && !this.categoryCache.has(bookmark.id)) {
          this.categoryCache.set(bookmark.id, category);
        }
        
        const processedBookmark: ChromeBookmark = {
          id: bookmark.id,
          title: bookmark.title || '',
          url: bookmark.url,
          dateAdded: bookmark.dateAdded,
          parentId: bookmark.parentId,
          category: category || undefined
        };
        
        // Add to cache
        this.bookmarkCache.set(bookmark.id, processedBookmark);
        processedBatch.push(processedBookmark);
      } catch (error) {
        console.error('Error processing bookmark:', bookmark, error);
      }
    }
    
    return processedBatch;
  }

  /**
   * Continue loading bookmarks in the background after initial data is displayed
   */
  private async refreshBookmarksInBackground(
    onProgress?: (progress: number) => void,
    onBatchComplete?: (bookmarks: ChromeBookmark[]) => void
  ): Promise<void> {
    try {
      if (!chrome.bookmarks) return;
      
      const allBookmarks = await chrome.bookmarks.getRecent(2000);
      const processedBookmarks: ChromeBookmark[] = [];
      
      // Process in batches
      for (let i = 0; i < allBookmarks.length; i += BATCH_SIZE) {
        const batch = allBookmarks.slice(i, i + BATCH_SIZE);
        const batchResults = await this.processBatch(batch);
        
        processedBookmarks.push(...batchResults);
        
        if (onProgress) {
          const progress = Math.min(100, Math.round((i + batch.length) / allBookmarks.length * 100));
          onProgress(progress);
        }
        
        if (onBatchComplete && batchResults.length > 0) {
          onBatchComplete(batchResults);
        }
        
        // Add small delay between batches to avoid UI blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Cache the results
      await this.setCachedBookmarks(processedBookmarks);
    } catch (error) {
      console.error('Error refreshing bookmarks in background:', error);
    }
  }

  /**
   * Get bookmarks from cache
   */
  private async getCachedBookmarks(): Promise<ChromeBookmark[] | null> {
    try {
      // Try local storage first for quick load
      const cached = localStorage.getItem('bookmark_cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) { // 5 minutes cache
          return data;
        }
      }

      // If no local cache, try Chrome sync storage
      const syncedData = await chromeDb.get<{ data: ChromeBookmark[]; timestamp: number }>('bookmark_cache');
      if (syncedData && Date.now() - syncedData.timestamp < 60 * 60 * 1000) { // 1 hour cache
        return syncedData.data;
      }

      return null;
    } catch (error) {
      console.error("Error getting cached bookmarks:", error);
      return null;
    }
  }

  /**
   * Cache bookmarks for faster loading
   */
  private async setCachedBookmarks(data: ChromeBookmark[]): Promise<void> {
    const cacheData = {
      data,
      timestamp: Date.now()
    };

    try {
      // Update both local and sync storage
      localStorage.setItem('bookmark_cache', JSON.stringify(cacheData));
      
      try {
        await chromeDb.set('bookmark_cache', cacheData);
      } catch (error) {
        console.warn("Cache might be too large for single storage item, using split storage");
        await this.splitBookmarksForStorage(data);
      }
    } catch (error) {
      console.error("Error caching bookmarks:", error);
    }
  }

  /**
   * Split bookmarks into chunks for storage (handles Chrome storage limitations)
   */
  private async splitBookmarksForStorage(bookmarks: ChromeBookmark[]): Promise<void> {
    try {
      const chunkSize = 20;
      const chunks = [];
      
      for (let i = 0; i < bookmarks.length; i += chunkSize) {
        chunks.push(bookmarks.slice(i, i + chunkSize));
      }
      
      // Clear existing chunks
      const keys = await chromeDb.keys();
      for (const key of keys) {
        if (key.startsWith('bookmarks_chunk_')) {
          await chromeDb.remove(key);
        }
      }
      
      // Store new chunks
      for (let i = 0; i < chunks.length; i++) {
        await chromeDb.set(`bookmarks_chunk_${i}`, chunks[i]);
      }
      
      // Store chunk count
      await chromeDb.set('bookmarks_chunk_count', chunks.length);
      console.log(`Split ${bookmarks.length} bookmarks into ${chunks.length} chunks`);
    } catch (error) {
      console.error("Error splitting bookmarks for storage:", error);
    }
  }

  /**
   * Get category for a bookmark
   */
  async getCategory(bookmarkId: string): Promise<string | undefined> {
    // Check cache first
    if (this.categoryCache.has(bookmarkId)) {
      return this.categoryCache.get(bookmarkId);
    }
    
    // Try to get from storage
    try {
      const category = await chromeDb.get<string>(`bookmark-category-${bookmarkId}`);
      if (category) {
        this.categoryCache.set(bookmarkId, category);
      }
      return category;
    } catch (error) {
      console.error("Error getting bookmark category:", error);
      return undefined;
    }
  }

  /**
   * Set category for a bookmark
   */
  async setCategory(bookmarkId: string, category: string): Promise<void> {
    try {
      await chromeDb.set(`bookmark-category-${bookmarkId}`, category);
      this.categoryCache.set(bookmarkId, category);
      
      // Update in cache if present
      const bookmark = this.bookmarkCache.get(bookmarkId);
      if (bookmark) {
        bookmark.category = category;
        this.bookmarkCache.set(bookmarkId, bookmark);
      }
    } catch (error) {
      console.error("Error setting bookmark category:", error);
      throw error;
    }
  }

  /**
   * Clear caches to force fresh data load
   */
  clearCache(): void {
    this.bookmarkCache.clear();
    this.isInitialized = false;
    localStorage.removeItem('bookmark_cache');
    console.log('BookmarkLoader cache cleared');
  }
}

// Singleton instance
export const bookmarkLoader = new BookmarkLoader();
