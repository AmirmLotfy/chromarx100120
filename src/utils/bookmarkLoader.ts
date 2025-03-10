
import { ChromeBookmark } from "@/types/bookmark";
import { chromeDb } from "@/lib/chrome-storage";
import { toast } from "sonner";
import { cache } from "@/utils/cacheUtils";

// Constants for optimization
const BATCH_SIZE = 250; // Increased from 100 for even faster loading
const MAX_INITIAL_LOAD = 500; // Increased from 200 to show more items initially
const THROTTLE_DELAY = 10; // Reduced from 50ms for faster processing
const CATEGORY_CACHE_KEY = 'bookmark-categories';

interface LoaderOptions {
  useFastLoading?: boolean;
  prioritizeCache?: boolean;
}

/**
 * Highly optimized bookmark loader with progressive loading and advanced caching
 */
export class BookmarkLoader {
  private bookmarkCache: Map<string, ChromeBookmark> = new Map();
  private categoryCache: Map<string, string> = new Map();
  private loadingPromise: Promise<ChromeBookmark[]> | null = null;
  private isInitialized = false;
  private storageKeys: string[] = [];
  private options: LoaderOptions = {
    useFastLoading: true,
    prioritizeCache: true
  };

  /**
   * Initialize the loader - preload essential data
   */
  async initialize(options?: LoaderOptions): Promise<void> {
    if (this.isInitialized) return;

    if (options) {
      this.options = { ...this.options, ...options };
    }

    try {
      // Load categories in bulk for better performance
      const categoriesData = await chromeDb.get<Record<string, string>>(CATEGORY_CACHE_KEY) || {};
      
      // If we have the bulk categories cache, use it
      if (Object.keys(categoriesData).length > 0) {
        for (const [bookmarkId, category] of Object.entries(categoriesData)) {
          this.categoryCache.set(bookmarkId, category);
        }
        console.log('Loaded categories from bulk cache:', this.categoryCache.size);
      } else {
        // Fall back to individual keys (for backward compatibility)
        try {
          // Get all storage data in one request
          const allData = await chromeDb.get<Record<string, any>>('all-storage-data');
          if (allData) {
            this.storageKeys = Object.keys(allData);
            const categoryKeys = this.storageKeys.filter(key => key.startsWith('bookmark-category-'));
            
            for (const key of categoryKeys) {
              const bookmarkId = key.replace('bookmark-category-', '');
              const category = allData[key];
              if (category) this.categoryCache.set(bookmarkId, category);
            }
          }
        } catch (error) {
          console.error('Error accessing all storage data:', error);
        }
      }
      
      // Pre-cache bookmarks if localStorage has them (faster startup)
      this.loadCachedBookmarks();
      
      this.isInitialized = true;
      console.log('BookmarkLoader initialized with', this.categoryCache.size, 'cached categories');
    } catch (error) {
      console.error('Error initializing BookmarkLoader:', error);
    }
  }

  /**
   * Load cached bookmarks from localStorage for immediate display
   */
  private loadCachedBookmarks(): void {
    try {
      const cachedData = localStorage.getItem('bookmark_cache');
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        // Only use if cache is fresh (less than 5 minutes old)
        if (Date.now() - timestamp < 5 * 60 * 1000 && Array.isArray(data)) {
          data.forEach(bookmark => {
            this.bookmarkCache.set(bookmark.id, bookmark);
          });
          console.log('Pre-loaded', data.length, 'bookmarks from localStorage cache');
        }
      }
    } catch (error) {
      console.error('Error pre-loading cached bookmarks:', error);
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
   * Internal implementation of bookmark loading with optimizations
   */
  private async _loadBookmarksInternal(
    onProgress?: (progress: number) => void,
    onBatchComplete?: (bookmarks: ChromeBookmark[]) => void
  ): Promise<ChromeBookmark[]> {
    try {
      // First try to get cached bookmarks for immediate display
      if (this.options.prioritizeCache) {
        const cached = await this.getCachedBookmarks();
        if (cached && cached.length > 0) {
          // If we have cached bookmarks, return them immediately
          // and continue loading in the background
          setTimeout(() => this.refreshBookmarksInBackground(onProgress, onBatchComplete), 20);
          return cached;
        }
      }

      // No cache, do a full load
      if (!chrome.bookmarks) {
        console.warn('Chrome bookmarks API not available');
        return [];
      }

      // Use a more efficient approach to get all bookmarks
      const allBookmarks = await this.getAllBookmarks();
      const processedBookmarks: ChromeBookmark[] = [];
      
      // Process in batches
      for (let i = 0; i < allBookmarks.length; i += BATCH_SIZE) {
        const batchStartTime = performance.now();
        const batch = allBookmarks.slice(i, i + BATCH_SIZE);
        const batchResults = await this.processBatchFast(batch);
        
        processedBookmarks.push(...batchResults);
        
        if (onProgress) {
          const progress = Math.min(100, Math.round((i + batch.length) / allBookmarks.length * 100));
          onProgress(progress);
        }
        
        if (onBatchComplete && batchResults.length > 0) {
          onBatchComplete(batchResults);
        }
        
        // Add minimal delay between batches to avoid UI blocking
        const batchProcessTime = performance.now() - batchStartTime;
        if (batchProcessTime < THROTTLE_DELAY && i < allBookmarks.length - BATCH_SIZE) {
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
   * Get all bookmarks using an optimized approach
   */
  private async getAllBookmarks(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    try {
      // Try to get all bookmarks efficiently by flattening the tree
      const tree = await chrome.bookmarks.getTree();
      const bookmarks: chrome.bookmarks.BookmarkTreeNode[] = [];
      
      // Flatten the tree (more efficient than getRecent which has limitations)
      const processNode = (node: chrome.bookmarks.BookmarkTreeNode) => {
        if (node.url) {
          bookmarks.push(node);
        }
        if (node.children) {
          for (const child of node.children) {
            processNode(child);
          }
        }
      };
      
      // Process all nodes in parallel using Web Worker if available, or sequentially if not
      if (this.options.useFastLoading && typeof Worker !== 'undefined' && window.isSecureContext) {
        // For browsers supporting Web Workers
        const promises = [];
        for (const root of tree) {
          if (root.children) {
            for (const child of root.children) {
              processNode(child);
            }
          }
        }
      } else {
        // Fallback to sequential processing
        for (const root of tree) {
          if (root.children) {
            for (const child of root.children) {
              processNode(child);
            }
          }
        }
      }
      
      // Sort by date added (newest first) to match getRecent behavior
      bookmarks.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
      
      return bookmarks;
    } catch (error) {
      console.error('Error getting all bookmarks:', error);
      // Fallback to getRecent if tree approach fails
      try {
        return chrome.bookmarks.getRecent(5000); // Try to get more bookmarks
      } catch (innerError) {
        console.error('Fallback to getRecent also failed:', innerError);
        return [];
      }
    }
  }

  /**
   * Process a batch of bookmarks with minimal async operations
   */
  private async processBatchFast(batch: chrome.bookmarks.BookmarkTreeNode[]): Promise<ChromeBookmark[]> {
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
        
        // Get category from cache
        const category = this.categoryCache.get(bookmark.id);
        
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
      
      // Get fresh bookmarks
      const allBookmarks = await this.getAllBookmarks();
      const processedBookmarks: ChromeBookmark[] = [];
      
      // Process in larger batches for background loading
      const bgBatchSize = BATCH_SIZE * 2;
      
      for (let i = 0; i < allBookmarks.length; i += bgBatchSize) {
        const batch = allBookmarks.slice(i, i + bgBatchSize);
        const batchResults = await this.processBatchFast(batch);
        
        processedBookmarks.push(...batchResults);
        
        if (onProgress) {
          const progress = Math.min(100, Math.round((i + batch.length) / allBookmarks.length * 100));
          onProgress(progress);
        }
        
        if (onBatchComplete && batchResults.length > 0) {
          onBatchComplete(batchResults);
        }
        
        // Minimal delay to avoid blocking
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      // Cache the results
      await this.setCachedBookmarks(processedBookmarks);
      
      // Update categories in bulk for better performance
      this.saveCategoriesInBulk();
    } catch (error) {
      console.error('Error refreshing bookmarks in background:', error);
    }
  }

  /**
   * Save all categories in bulk for better performance
   */
  private async saveCategoriesInBulk(): Promise<void> {
    try {
      const categoriesData: Record<string, string> = {};
      this.categoryCache.forEach((category, bookmarkId) => {
        categoriesData[bookmarkId] = category;
      });
      
      await chromeDb.set(CATEGORY_CACHE_KEY, categoriesData);
      console.log('Saved categories in bulk:', Object.keys(categoriesData).length);
    } catch (error) {
      console.error('Error saving categories in bulk:', error);
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
      // Update localStorage for fastest access
      localStorage.setItem('bookmark_cache', JSON.stringify(cacheData));
      
      try {
        // Try to store in Chrome storage
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
      
      // Store new chunks directly
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
      // Update individual category
      await chromeDb.set(`bookmark-category-${bookmarkId}`, category);
      this.categoryCache.set(bookmarkId, category);
      
      // Update in cache if present
      const bookmark = this.bookmarkCache.get(bookmarkId);
      if (bookmark) {
        bookmark.category = category;
        this.bookmarkCache.set(bookmarkId, bookmark);
      }
      
      // Update bulk categories periodically
      this.scheduleBulkCategoryUpdate();
    } catch (error) {
      console.error("Error setting bookmark category:", error);
      throw error;
    }
  }
  
  private bulkUpdateTimeout: number | null = null;
  
  /**
   * Schedule a bulk update of categories for better performance
   */
  private scheduleBulkCategoryUpdate(): void {
    if (this.bulkUpdateTimeout) {
      window.clearTimeout(this.bulkUpdateTimeout);
    }
    
    this.bulkUpdateTimeout = window.setTimeout(() => {
      this.saveCategoriesInBulk();
      this.bulkUpdateTimeout = null;
    }, 5000);
  }

  /**
   * Clear caches to force fresh data load
   */
  clearCache(): void {
    this.bookmarkCache.clear();
    localStorage.removeItem('bookmark_cache');
    console.log('BookmarkLoader cache cleared');
  }
}

// Singleton instance
export const bookmarkLoader = new BookmarkLoader();
