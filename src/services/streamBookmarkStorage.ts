/**
 * Stream-based Bookmark Storage Service
 * Utilizes the Streams API and enhanced IndexedDB service for efficient bookmark operations
 */

import { ChromeBookmark } from "@/types/bookmark";
import { enhancedIndexedDb } from "./enhancedIndexedDbService";
import { toast } from "sonner";
import { processWithStreams, processInBatches, createTransformStream } from "@/utils/webStreamUtils";
import { v4 as uuidv4 } from "uuid";

interface BookmarkIndex {
  id: string;
  title: string;
  url?: string;
  category?: string;
  content?: string;
  tags?: string[];
  dateAdded: number;
  parentId?: string;
}

interface BookmarkSearchOptions {
  query?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'title' | 'dateAdded' | 'category' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  categoryFilter?: string;
  tagFilter?: string[];
}

interface SyncOptions {
  forceRefresh?: boolean;
  onProgress?: (progress: number) => void;
  onBatchComplete?: (bookmarks: ChromeBookmark[]) => void;
  signal?: AbortSignal;
}

class StreamBookmarkStorage {
  private static instance: StreamBookmarkStorage;
  private readonly BOOKMARKS_STORE = 'bookmarks';
  private readonly BOOKMARK_INDEX_STORE = 'bookmark_indices';
  private readonly CATEGORY_STORE = 'categories';
  private readonly META_STORE = 'bookmark_metadata';
  
  private memoryCache: Map<string, ChromeBookmark> = new Map();
  private searchCache: Map<string, { results: ChromeBookmark[], timestamp: number }> = new Map();
  private categoryCache: Map<string, string[]> = new Map();
  
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MEMORY_CACHE_SIZE = 500; // Number of most recent bookmarks to keep in memory
  
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): StreamBookmarkStorage {
    if (!this.instance) {
      this.instance = new StreamBookmarkStorage();
    }
    return this.instance;
  }

  /**
   * Initialize the bookmark storage
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this._initialize();
    return this.initPromise;
  }
  
  /**
   * Internal initialization method
   */
  private async _initialize(): Promise<void> {
    try {
      console.log('Initializing stream bookmark storage...');
      
      // Preload categories for faster filtering
      try {
        const categories = await enhancedIndexedDb.getAll<{id: string, name: string}>(this.CATEGORY_STORE);
        categories.forEach(category => {
          if (!this.categoryCache.has(category.name)) {
            this.categoryCache.set(category.name, []);
          }
        });
        console.log(`Loaded ${categories.length} categories`);
      } catch (error) {
        console.warn('No categories found or error loading categories');
      }
      
      // Preload some bookmarks to memory for instant access
      await this.preloadMemoryCache();
      
      this.isInitialized = true;
      console.log('Stream bookmark storage initialized');
    } catch (error) {
      console.error('Error initializing bookmark storage:', error);
      this.initPromise = null;
      throw error;
    }
  }
  
  /**
   * Preload most recent bookmarks into memory cache
   */
  private async preloadMemoryCache(): Promise<void> {
    try {
      const bookmarks = await enhancedIndexedDb.getAll<ChromeBookmark>(this.BOOKMARKS_STORE, {
        index: 'dateAdded',
        direction: 'prev', // Descending order
        limit: this.MEMORY_CACHE_SIZE
      });
      
      bookmarks.forEach(bookmark => {
        this.memoryCache.set(bookmark.id, bookmark);
      });
      
      console.log(`Preloaded ${bookmarks.length} bookmarks to memory cache`);
    } catch (error) {
      console.error('Error preloading memory cache:', error);
    }
  }

  /**
   * Create an index object from a bookmark
   */
  private createBookmarkIndex(bookmark: ChromeBookmark): BookmarkIndex {
    return {
      id: bookmark.id,
      title: bookmark.title.toLowerCase(),
      url: bookmark.url?.toLowerCase(),
      category: bookmark.category?.toLowerCase(),
      content: bookmark.content?.toLowerCase(),
      tags: bookmark.tags?.map(tag => tag.toLowerCase()),
      dateAdded: bookmark.dateAdded || Date.now(),
      parentId: bookmark.parentId
    };
  }

  /**
   * Add a single bookmark using streams
   */
  async addBookmark(bookmark: ChromeBookmark): Promise<void> {
    try {
      await this.initialize();
      
      // Ensure the bookmark has an ID
      if (!bookmark.id) {
        bookmark.id = uuidv4();
      }
      
      // Ensure dateAdded is set
      if (!bookmark.dateAdded) {
        bookmark.dateAdded = Date.now();
      }
      
      await Promise.all([
        enhancedIndexedDb.put(this.BOOKMARKS_STORE, bookmark),
        enhancedIndexedDb.put(this.BOOKMARK_INDEX_STORE, this.createBookmarkIndex(bookmark))
      ]);
      
      // Update memory cache
      this.memoryCache.set(bookmark.id, bookmark);
      
      // Add to category index if needed
      if (bookmark.category && !this.categoryCache.has(bookmark.category)) {
        this.categoryCache.set(bookmark.category, []);
        await enhancedIndexedDb.put(this.CATEGORY_STORE, {
          id: `category_${bookmark.category.replace(/\s+/g, '_').toLowerCase()}`,
          name: bookmark.category
        });
      }
      
      // Clear search cache after updates
      this.clearSearchCache();
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  /**
   * Add multiple bookmarks using streams for efficiency
   */
  async addBookmarks(bookmarks: ChromeBookmark[]): Promise<void> {
    try {
      if (bookmarks.length === 0) return;
      
      await this.initialize();
      
      // Process the bookmarks in a stream to prepare them
      const processedBookmarks = await processWithStreams(
        bookmarks,
        (bookmark) => {
          // Ensure each bookmark has an ID and dateAdded
          if (!bookmark.id) {
            bookmark.id = uuidv4();
          }
          if (!bookmark.dateAdded) {
            bookmark.dateAdded = Date.now();
          }
          return bookmark;
        }
      );
      
      // Create indices for all bookmarks
      const indices = processedBookmarks.map(bookmark => this.createBookmarkIndex(bookmark));
      
      // Use batch processing for large datasets
      if (processedBookmarks.length > 500) {
        await Promise.all([
          processInBatches(
            processedBookmarks,
            async (batch) => {
              await enhancedIndexedDb.putBulk(this.BOOKMARKS_STORE, batch);
              return batch;
            },
            { batchSize: 250 }
          ),
          processInBatches(
            indices,
            async (batch) => {
              await enhancedIndexedDb.putBulk(this.BOOKMARK_INDEX_STORE, batch);
              return batch;
            },
            { batchSize: 250 }
          )
        ]);
      } else {
        // For smaller datasets, use a single batch
        await Promise.all([
          enhancedIndexedDb.putBulk(this.BOOKMARKS_STORE, processedBookmarks),
          enhancedIndexedDb.putBulk(this.BOOKMARK_INDEX_STORE, indices)
        ]);
      }
      
      // Update memory cache for the most recent bookmarks
      processedBookmarks.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
      const recentBookmarks = processedBookmarks.slice(0, this.MEMORY_CACHE_SIZE);
      
      recentBookmarks.forEach(bookmark => {
        this.memoryCache.set(bookmark.id, bookmark);
      });
      
      // Update category index
      const categories = new Set<string>();
      processedBookmarks.forEach(bookmark => {
        if (bookmark.category) categories.add(bookmark.category);
      });
      
      // Add new categories to the store
      const categoriesToAdd = [];
      for (const category of categories) {
        if (!this.categoryCache.has(category)) {
          this.categoryCache.set(category, []);
          categoriesToAdd.push({
            id: `category_${category.replace(/\s+/g, '_').toLowerCase()}`,
            name: category
          });
        }
      }
      
      if (categoriesToAdd.length > 0) {
        await enhancedIndexedDb.putBulk(this.CATEGORY_STORE, categoriesToAdd);
      }
      
      // Clear search cache after bulk updates
      this.clearSearchCache();
    } catch (error) {
      console.error('Error adding bookmarks in bulk:', error);
      throw error;
    }
  }

  /**
   * Clear the search cache
   */
  private clearSearchCache(): void {
    this.searchCache.clear();
  }

  /**
   * Search bookmarks using streams
   */
  async searchBookmarks(options: BookmarkSearchOptions = {}): Promise<ChromeBookmark[]> {
    const { 
      query = '', 
      limit = 100, 
      offset = 0, 
      sortBy = 'relevance', 
      sortOrder = 'desc', 
      categoryFilter,
      tagFilter
    } = options;
    
    if (!query.trim() && !categoryFilter && !tagFilter) {
      // If no query and no filters, return recent bookmarks
      return this.getRecentBookmarks(limit, offset);
    }

    try {
      await this.initialize();
      
      // Generate cache key based on search parameters
      const cacheKey = `${query}_${limit}_${offset}_${sortBy}_${sortOrder}_${categoryFilter || ''}_${tagFilter?.join(',') || ''}`;
      
      // Check cache first
      const cached = this.searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.results;
      }
      
      // Fetch all indices from the database
      const indices = await enhancedIndexedDb.getAll<BookmarkIndex>(this.BOOKMARK_INDEX_STORE);
      
      // Stream processing for search operation
      let filteredIndices = indices;
      
      // Apply category filter if specified
      if (categoryFilter) {
        filteredIndices = filteredIndices.filter(index => 
          index.category === categoryFilter.toLowerCase()
        );
      }
      
      // Apply tag filter if specified
      if (tagFilter && tagFilter.length > 0) {
        const normalizedTags = tagFilter.map(tag => tag.toLowerCase());
        filteredIndices = filteredIndices.filter(index => 
          index.tags?.some(tag => normalizedTags.includes(tag))
        );
      }
      
      // If no query, just filter and sort
      if (!query.trim()) {
        const sortedIndices = this.sortIndices(filteredIndices, sortBy, sortOrder);
        const paginatedIds = sortedIndices.slice(offset, offset + limit).map(index => index.id);
        
        // Get full bookmarks for matching IDs
        const bookmarks = await processWithStreams(
          paginatedIds,
          id => this.getBookmark(id)
        );
        
        const results = bookmarks.filter((bookmark): bookmark is ChromeBookmark => bookmark !== null);
        
        // Cache the results
        this.searchCache.set(cacheKey, { results, timestamp: Date.now() });
        
        return results;
      }
      
      // Process search query with streams
      const queryWords = query.toLowerCase().trim().split(/\s+/);
      
      // Score and filter indices using streams
      const scoredIndices = await processWithStreams(
        filteredIndices,
        (index) => {
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
          
          return { id: index.id, score, index };
        }
      );
      
      // Filter out zero scores and sort
      const filteredScores = scoredIndices.filter(result => result.score > 0);
      
      // Sort by score or other criteria
      let sortedScores = filteredScores;
      if (sortBy === 'relevance') {
        sortedScores = filteredScores.sort((a, b) => 
          sortOrder === 'desc' ? b.score - a.score : a.score - b.score
        );
      } else {
        sortedScores = this.sortScoredIndices(filteredScores, sortBy, sortOrder);
      }
      
      // Apply pagination
      const paginatedIds = sortedScores
        .slice(offset, offset + limit)
        .map(result => result.id);
      
      // Get full bookmarks for matching IDs using streams
      const bookmarks = await processWithStreams(
        paginatedIds,
        id => this.getBookmark(id)
      );
      
      const results = bookmarks.filter((bookmark): bookmark is ChromeBookmark => bookmark !== null);
      
      // Cache the results
      this.searchCache.set(cacheKey, { results, timestamp: Date.now() });
      
      return results;
    } catch (error) {
      console.error('Error searching bookmarks:', error);
      return [];
    }
  }
  
  /**
   * Sort index objects by the specified criteria
   */
  private sortIndices(indices: BookmarkIndex[], sortBy: string, sortOrder: 'asc' | 'desc'): BookmarkIndex[] {
    switch (sortBy) {
      case 'title':
        return [...indices].sort((a, b) => {
          return sortOrder === 'asc' 
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        });
      case 'dateAdded':
        return [...indices].sort((a, b) => {
          return sortOrder === 'asc' 
            ? (a.dateAdded || 0) - (b.dateAdded || 0)
            : (b.dateAdded || 0) - (a.dateAdded || 0);
        });
      case 'category':
        return [...indices].sort((a, b) => {
          const catA = a.category || '';
          const catB = b.category || '';
          return sortOrder === 'asc' 
            ? catA.localeCompare(catB)
            : catB.localeCompare(catA);
        });
      default:
        return indices;
    }
  }
  
  /**
   * Sort scored index objects by the specified criteria
   */
  private sortScoredIndices(
    scoredIndices: Array<{ id: string; score: number; index: BookmarkIndex }>,
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Array<{ id: string; score: number; index: BookmarkIndex }> {
    const sorted = [...scoredIndices]; // Create a copy to avoid mutating the original
    
    switch (sortBy) {
      case 'title':
        return sorted.sort((a, b) => {
          return sortOrder === 'asc' 
            ? a.index.title.localeCompare(b.index.title)
            : b.index.title.localeCompare(a.index.title);
        });
      case 'dateAdded':
        return sorted.sort((a, b) => {
          return sortOrder === 'asc' 
            ? (a.index.dateAdded || 0) - (b.index.dateAdded || 0)
            : (b.index.dateAdded || 0) - (a.index.dateAdded || 0);
        });
      case 'category':
        return sorted.sort((a, b) => {
          const catA = a.index.category || '';
          const catB = b.index.category || '';
          return sortOrder === 'asc' 
            ? catA.localeCompare(catB)
            : catB.localeCompare(catA);
        });
      default:
        return sorted;
    }
  }

  /**
   * Get recently added bookmarks
   */
  async getRecentBookmarks(limit = 50, offset = 0): Promise<ChromeBookmark[]> {
    try {
      await this.initialize();
      
      // If we have enough bookmarks in memory cache, use that for instant results
      if (this.memoryCache.size >= offset + limit) {
        const cachedBookmarks = Array.from(this.memoryCache.values())
          .sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0))
          .slice(offset, offset + limit);
        
        return cachedBookmarks;
      }
      
      // Otherwise query the database
      const bookmarks = await enhancedIndexedDb.getAll<ChromeBookmark>(this.BOOKMARKS_STORE, {
        index: 'dateAdded',
        direction: 'prev', // Descending order
        limit,
        offset
      });
      
      return bookmarks;
    } catch (error) {
      console.error('Error getting recent bookmarks:', error);
      return [];
    }
  }

  /**
   * Update a bookmark
   */
  async updateBookmark(bookmark: ChromeBookmark): Promise<void> {
    try {
      await this.initialize();
      
      // Ensure dateAdded is preserved if it exists
      if (!bookmark.dateAdded) {
        const existing = await this.getBookmark(bookmark.id);
        if (existing) {
          bookmark.dateAdded = existing.dateAdded;
        } else {
          bookmark.dateAdded = Date.now();
        }
      }
      
      await Promise.all([
        enhancedIndexedDb.put(this.BOOKMARKS_STORE, bookmark),
        enhancedIndexedDb.put(this.BOOKMARK_INDEX_STORE, this.createBookmarkIndex(bookmark))
      ]);
      
      // Update memory cache
      this.memoryCache.set(bookmark.id, bookmark);
      
      // Add to category index if needed
      if (bookmark.category && !this.categoryCache.has(bookmark.category)) {
        this.categoryCache.set(bookmark.category, []);
        await enhancedIndexedDb.put(this.CATEGORY_STORE, {
          id: `category_${bookmark.category.replace(/\s+/g, '_').toLowerCase()}`,
          name: bookmark.category
        });
      }
      
      this.clearSearchCache();
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw error;
    }
  }

  /**
   * Delete a bookmark
   */
  async deleteBookmark(id: string): Promise<void> {
    try {
      await this.initialize();
      
      await Promise.all([
        enhancedIndexedDb.delete(this.BOOKMARKS_STORE, id),
        enhancedIndexedDb.delete(this.BOOKMARK_INDEX_STORE, id)
      ]);
      
      // Remove from memory cache
      this.memoryCache.delete(id);
      
      this.clearSearchCache();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw error;
    }
  }

  /**
   * Delete multiple bookmarks using streams
   */
  async deleteBookmarks(ids: string[]): Promise<void> {
    try {
      if (ids.length === 0) return;
      
      await this.initialize();
      
      // Use batch processing for larger datasets
      if (ids.length > 100) {
        await processInBatches(
          ids,
          async (batch) => {
            await Promise.all([
              enhancedIndexedDb.deleteBulk(this.BOOKMARKS_STORE, batch),
              enhancedIndexedDb.deleteBulk(this.BOOKMARK_INDEX_STORE, batch)
            ]);
            
            // Remove from memory cache
            batch.forEach(id => this.memoryCache.delete(id));
            
            return batch;
          },
          {
            batchSize: 50,
            onProgress: (processed, total, percentage) => {
              if (percentage % 20 === 0) {
                console.log(`Deleting bookmarks: ${percentage}% complete`);
              }
            }
          }
        );
      } else {
        // For smaller datasets, delete all at once
        await Promise.all([
          enhancedIndexedDb.deleteBulk(this.BOOKMARKS_STORE, ids),
          enhancedIndexedDb.deleteBulk(this.BOOKMARK_INDEX_STORE, ids)
        ]);
        
        // Remove from memory cache
        ids.forEach(id => this.memoryCache.delete(id));
      }
      
      this.clearSearchCache();
    } catch (error) {
      console.error('Error deleting bookmarks in bulk:', error);
      throw error;
    }
  }

  /**
   * Get a bookmark by ID
   */
  async getBookmark(id: string): Promise<ChromeBookmark | null> {
    try {
      await this.initialize();
      
      // Check memory cache first for instant access
      if (this.memoryCache.has(id)) {
        return this.memoryCache.get(id) || null;
      }
      
      // If not in memory, get from database
      const bookmark = await enhancedIndexedDb.get<ChromeBookmark>(this.BOOKMARKS_STORE, id);
      
      // If found, add to memory cache
      if (bookmark) {
        this.memoryCache.set(id, bookmark);
      }
      
      return bookmark;
    } catch (error) {
      console.error('Error getting bookmark:', error);
      return null;
    }
  }

  /**
   * Get all bookmarks with pagination
   */
  async getAllBookmarks(options: { limit?: number; offset?: number } = {}): Promise<ChromeBookmark[]> {
    try {
      await this.initialize();
      
      const { limit, offset } = options;
      
      return await enhancedIndexedDb.getAll<ChromeBookmark>(this.BOOKMARKS_STORE, { 
        index: 'dateAdded',
        direction: 'prev', // Descending order
        limit, 
        offset
      });
    } catch (error) {
      console.error('Error getting all bookmarks:', error);
      return [];
    }
  }
  
  /**
   * Get all bookmarks as a stream for processing
   */
  async streamAllBookmarks<R>(
    processFn: (bookmark: ChromeBookmark) => Promise<R> | R,
    options: {
      onProgress?: (processed: number, total: number, percentage: number) => void;
      onComplete?: (results: R[]) => void;
      limit?: number;
      offset?: number;
      signal?: AbortSignal;
    } = {}
  ): Promise<R[]> {
    try {
      await this.initialize();
      
      const { limit, offset, onProgress, onComplete, signal } = options;
      
      // Get total count first for progress reporting
      const totalCount = await enhancedIndexedDb.count(this.BOOKMARKS_STORE);
      const effectiveLimit = limit || totalCount;
      const effectiveOffset = offset || 0;
      
      return enhancedIndexedDb.getAllAsStream<ChromeBookmark, R>(
        this.BOOKMARKS_STORE,
        processFn,
        {
          index: 'dateAdded',
          direction: 'prev', // Descending order
          limit: effectiveLimit,
          offset: effectiveOffset,
          onProgress,
          onComplete,
          signal
        }
      );
    } catch (error) {
      console.error('Error streaming all bookmarks:', error);
      return [];
    }
  }
  
  /**
   * Get all categories
   */
  async getAllCategories(): Promise<string[]> {
    try {
      await this.initialize();
      
      const categories = await enhancedIndexedDb.getAll<{id: string, name: string}>(this.CATEGORY_STORE);
      return categories.map(category => category.name);
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }
  
  /**
   * Count all bookmarks
   */
  async getBookmarkCount(): Promise<number> {
    try {
      await this.initialize();
      return await enhancedIndexedDb.count(this.BOOKMARKS_STORE);
    } catch (error) {
      console.error('Error getting bookmark count:', error);
      return 0;
    }
  }
  
  /**
   * Search for bookmarks by prefix for autocomplete features
   */
  async prefixSearch(prefix: string, limit = 10): Promise<ChromeBookmark[]> {
    if (!prefix.trim()) return [];

    try {
      await this.initialize();
      
      const indices = await enhancedIndexedDb.getAll<BookmarkIndex>(this.BOOKMARK_INDEX_STORE);
      const normalizedPrefix = prefix.toLowerCase().trim();
      
      // Find matches based on prefix
      const matchingIndices = indices.filter(index => 
        index.title.startsWith(normalizedPrefix) ||
        index.url?.includes(normalizedPrefix) ||
        index.category?.startsWith(normalizedPrefix)
      );
      
      // Score and sort the matches
      const scoredIndices = matchingIndices.map(index => {
        let score = 0;
        
        // Title matches are most important
        if (index.title.startsWith(normalizedPrefix)) {
          score += 10;
          // Exact title match is even more important
          if (index.title === normalizedPrefix) score += 5;
        }
        
        // URL matches are next most important
        if (index.url?.includes(normalizedPrefix)) {
          score += 7;
          // URL starts with is more important
          if (index.url.startsWith(normalizedPrefix)) score += 3;
        }
        
        // Category matches are less important
        if (index.category?.startsWith(normalizedPrefix)) {
          score += 5;
        }
        
        return { id: index.id, score };
      });
      
      // Sort by score and limit results
      const sortedIds = scoredIndices
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.id);
      
      // Get full bookmarks for matching IDs using streams
      const bookmarks = await processWithStreams(
        sortedIds,
        id => this.getBookmark(id)
      );
      
      return bookmarks.filter((bookmark): bookmark is ChromeBookmark => bookmark !== null);
    } catch (error) {
      console.error('Error searching bookmarks by prefix:', error);
      return [];
    }
  }
  
  /**
   * Sync all bookmarks from Chrome API
   */
  async syncFromChromeBookmarks(options: SyncOptions = {}): Promise<ChromeBookmark[]> {
    try {
      await this.initialize();
      
      // If Chrome bookmarks API isn't available, return current bookmarks
      if (!chrome.bookmarks) {
        const bookmarks = await this.getAllBookmarks();
        return bookmarks;
      }
      
      const { forceRefresh = false, onProgress, onBatchComplete, signal } = options;
      
      // If force refresh, clear existing data
      if (forceRefresh) {
        await Promise.all([
          enhancedIndexedDb.clear(this.BOOKMARKS_STORE),
          enhancedIndexedDb.clear(this.BOOKMARK_INDEX_STORE)
        ]);
        this.memoryCache.clear();
        this.clearSearchCache();
      }
      
      // Get all bookmarks from Chrome using a stream-based approach
      const chromeBookmarks = await this.getAllChromeBookmarks();
      
      // Process the Chrome bookmarks in batches
      const allProcessedBookmarks: ChromeBookmark[] = await processInBatches(
        chromeBookmarks,
        async (batch) => {
          // Process each bookmark to determine update or insert
          const processedBatch = await processWithStreams(
            batch,
            async (chromeBookmark) => {
              if (!chromeBookmark.id || !chromeBookmark.title) {
                return null;
              }
              
              try {
                // Get existing bookmark to preserve custom data
                const existingBookmark = !forceRefresh 
                  ? await this.getBookmark(chromeBookmark.id)
                  : null;
                
                const bookmark: ChromeBookmark = {
                  id: chromeBookmark.id,
                  title: chromeBookmark.title,
                  url: chromeBookmark.url,
                  dateAdded: chromeBookmark.dateAdded,
                  parentId: chromeBookmark.parentId,
                  index: chromeBookmark.index,
                  // Preserve existing category and custom data
                  category: existingBookmark?.category,
                  tags: existingBookmark?.tags,
                  content: existingBookmark?.content,
                  metadata: existingBookmark?.metadata
                };
                
                return bookmark;
              } catch (error) {
                console.error('Error processing Chrome bookmark:', error);
                return null;
              }
            }
          );
          
          // Filter out nulls
          const validBookmarks = processedBatch.filter(
            (bookmark): bookmark is ChromeBookmark => bookmark !== null
          );
          
          // Store the processed batch
          await this.addBookmarks(validBookmarks);
          
          // Call batch complete callback if provided
          if (onBatchComplete) {
            onBatchComplete(validBookmarks);
          }
          
          return validBookmarks;
        },
        {
          batchSize: 100,
          onProgress,
          signal
        }
      );
      
      // Flatten the results
      const results = allProcessedBookmarks.flat();
      
      console.log(`Synced ${results.length} bookmarks from Chrome`);
      return results;
    } catch (error) {
      console.error('Error syncing from Chrome bookmarks:', error);
      toast.error('Failed to sync bookmarks from Chrome');
      return [];
    }
  }
  
  /**
   * Get all bookmarks from Chrome API
   */
  private async getAllChromeBookmarks(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    if (!chrome.bookmarks) {
      throw new Error('Chrome bookmarks API not available');
    }
    
    try {
      // Get the entire bookmark tree
      const tree = await chrome.bookmarks.getTree();
      const bookmarks: chrome.bookmarks.BookmarkTreeNode[] = [];
      
      // Recursively process the tree
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
      
      for (const root of tree) {
        if (root.children) {
          for (const child of root.children) {
            processNode(child);
          }
        }
      }
      
      return bookmarks;
    } catch (error) {
      console.error('Error getting Chrome bookmarks:', error);
      
      // Fallback to getRecent if tree approach fails
      try {
        return await chrome.bookmarks.getRecent(10000); // Try to get a large number
      } catch (fallbackError) {
        console.error('Fallback to getRecent also failed:', fallbackError);
        throw error;
      }
    }
  }
  
  /**
   * Clear all bookmark data
   */
  async clear(): Promise<void> {
    try {
      await Promise.all([
        enhancedIndexedDb.clear(this.BOOKMARKS_STORE),
        enhancedIndexedDb.clear(this.BOOKMARK_INDEX_STORE)
      ]);
      
      this.memoryCache.clear();
      this.clearSearchCache();
    } catch (error) {
      console.error('Error clearing bookmark storage:', error);
      throw error;
    }
  }
}

// Export the singleton instance
export const streamBookmarkStorage = StreamBookmarkStorage.getInstance();
