import { ChromeBookmark } from "@/types/bookmark";
import { bookmarkDbService } from "./indexedDbService";
import { toast } from "sonner";
import { isChromeExtension } from "@/lib/utils";
import { chromeDb } from "@/lib/chrome-storage";

const MEMORY_CACHE_SIZE = 500; // Number of most recent bookmarks to keep in memory
const BATCH_SIZE = 250; // Number of bookmarks to process in a batch

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
  query: string;
  limit?: number;
  offset?: number;
  sortBy?: 'title' | 'dateAdded' | 'category' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  categoryFilter?: string;
}

interface SyncOptions {
  forceRefresh?: boolean;
  onProgress?: (progress: number) => void;
  onBatchComplete?: (bookmarks: ChromeBookmark[]) => void;
}

export class EnhancedBookmarkStorage {
  private static instance: EnhancedBookmarkStorage;
  private readonly BOOKMARKS_STORE = 'bookmarks';
  private readonly BOOKMARK_INDEX_STORE = 'bookmark_indices';
  private readonly CATEGORY_STORE = 'categories';
  private readonly SYNC_STORE = 'sync_queue';
  private readonly META_STORE = 'bookmark_metadata';
  
  private memoryCache: Map<string, ChromeBookmark> = new Map();
  private searchCache: Map<string, { results: ChromeBookmark[], timestamp: number }> = new Map();
  private categoryCache: Map<string, string[]> = new Map();
  
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): EnhancedBookmarkStorage {
    if (!this.instance) {
      this.instance = new EnhancedBookmarkStorage();
    }
    return this.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this._initialize();
    return this.initPromise;
  }
  
  private async _initialize(): Promise<void> {
    try {
      console.log('Initializing enhanced bookmark storage...');
      
      // Make sure the database is ready
      try {
        await bookmarkDbService.count(this.BOOKMARKS_STORE);
        await bookmarkDbService.count(this.BOOKMARK_INDEX_STORE);
      } catch (error) {
        console.log('Stores do not exist yet, will be created on first use');
      }
      
      // Preload categories for faster filtering
      try {
        const categories = await bookmarkDbService.getAll<{id: string, name: string}>(this.CATEGORY_STORE);
        categories.forEach(category => {
          if (!this.categoryCache.has(category.name)) {
            this.categoryCache.set(category.name, []);
          }
        });
        console.log(`Loaded ${categories.length} categories`);
      } catch (error) {
        console.warn('No categories found or error loading categories');
      }
      
      // Migrate data from Chrome storage if needed
      await this.migrateFromChromeStorage();
      
      // Preload some bookmarks to memory for instant access
      await this.preloadMemoryCache();
      
      this.isInitialized = true;
      console.log('Enhanced bookmark storage initialized');
    } catch (error) {
      console.error('Error initializing bookmark storage:', error);
      this.initPromise = null;
      throw error;
    }
  }
  
  private async migrateFromChromeStorage(): Promise<void> {
    try {
      // Check if we've already migrated
      const migrated = await bookmarkDbService.get<{id: string, completed: boolean}>(this.META_STORE, 'migration_completed');
      if (migrated && migrated.completed) {
        console.log('Migration already completed');
        return;
      }
      
      console.log('Checking for data to migrate from Chrome storage...');
      
      // Only do migration in extension context
      if (isChromeExtension()) {
        // Check for bookmarks in chrome storage
        const chromeBookmarks = await chromeDb.get<ChromeBookmark[]>('bookmarks');
        
        if (chromeBookmarks && chromeBookmarks.length > 0) {
          console.log(`Migrating ${chromeBookmarks.length} bookmarks from Chrome storage...`);
          
          // Process in batches to prevent UI freezing
          for (let i = 0; i < chromeBookmarks.length; i += BATCH_SIZE) {
            const batch = chromeBookmarks.slice(i, i + BATCH_SIZE);
            await this.addBookmarks(batch);
            console.log(`Migrated batch ${i / BATCH_SIZE + 1}/${Math.ceil(chromeBookmarks.length / BATCH_SIZE)}`);
          }
          
          toast.success(`Migrated ${chromeBookmarks.length} bookmarks to IndexedDB`);
        }
        
        // Check for split bookmark storage
        try {
          const chunkCount = await chromeDb.get<number>('bookmarks_chunk_count');
          if (chunkCount && chunkCount > 0) {
            console.log(`Found ${chunkCount} bookmark chunks to migrate`);
            
            let migratedCount = 0;
            for (let i = 0; i < chunkCount; i++) {
              const chunk = await chromeDb.get<ChromeBookmark[]>(`bookmarks_chunk_${i}`);
              if (chunk && chunk.length > 0) {
                await this.addBookmarks(chunk);
                migratedCount += chunk.length;
                console.log(`Migrated chunk ${i + 1}/${chunkCount}`);
              }
            }
            
            if (migratedCount > 0) {
              toast.success(`Migrated ${migratedCount} bookmarks from chunked storage`);
            }
          }
        } catch (error) {
          console.error('Error migrating chunked bookmarks:', error);
        }
        
        // Migrate categories
        try {
          const categoriesData = await chromeDb.get<Record<string, string>>('bookmark-categories');
          if (categoriesData) {
            const uniqueCategories = new Set(Object.values(categoriesData));
            const categories = Array.from(uniqueCategories).map(name => ({ 
              id: `category_${name.replace(/\s+/g, '_').toLowerCase()}`,
              name
            }));
            
            if (categories.length > 0) {
              for (const category of categories) {
                await bookmarkDbService.put(this.CATEGORY_STORE, category);
              }
              console.log(`Migrated ${categories.length} categories`);
            }
          }
        } catch (error) {
          console.error('Error migrating categories:', error);
        }
      }
      
      // Mark migration as completed
      await bookmarkDbService.put(this.META_STORE, { id: 'migration_completed', completed: true });
      
    } catch (error) {
      console.error('Error during storage migration:', error);
    }
  }
  
  private async preloadMemoryCache(): Promise<void> {
    try {
      // Load the most recent bookmarks into memory
      const bookmarks = await bookmarkDbService.getAll<ChromeBookmark>(this.BOOKMARKS_STORE, {
        index: 'dateAdded',
        order: 'desc',
        limit: MEMORY_CACHE_SIZE
      });
      
      bookmarks.forEach(bookmark => {
        this.memoryCache.set(bookmark.id, bookmark);
      });
      
      console.log(`Preloaded ${bookmarks.length} bookmarks to memory cache`);
    } catch (error) {
      console.error('Error preloading memory cache:', error);
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
      dateAdded: bookmark.dateAdded || Date.now(),
      parentId: bookmark.parentId
    };
  }

  async addBookmark(bookmark: ChromeBookmark): Promise<void> {
    try {
      await this.initialize();
      
      await Promise.all([
        bookmarkDbService.put(this.BOOKMARKS_STORE, bookmark),
        bookmarkDbService.put(this.BOOKMARK_INDEX_STORE, this.createBookmarkIndex(bookmark))
      ]);
      
      // Update memory cache
      this.memoryCache.set(bookmark.id, bookmark);
      
      // Add to category index if needed
      if (bookmark.category && !this.categoryCache.has(bookmark.category)) {
        this.categoryCache.set(bookmark.category, []);
        await bookmarkDbService.put(this.CATEGORY_STORE, {
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

  async addBookmarks(bookmarks: ChromeBookmark[]): Promise<void> {
    try {
      if (bookmarks.length === 0) return;
      
      await this.initialize();
      
      const indices = bookmarks.map(bookmark => this.createBookmarkIndex(bookmark));
      
      // First store all bookmarks
      await Promise.all([
        bookmarkDbService.bulkPut(this.BOOKMARKS_STORE, bookmarks),
        bookmarkDbService.bulkPut(this.BOOKMARK_INDEX_STORE, indices)
      ]);
      
      // Update memory cache for the most recent bookmarks
      bookmarks.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
      const recentBookmarks = bookmarks.slice(0, MEMORY_CACHE_SIZE);
      
      recentBookmarks.forEach(bookmark => {
        this.memoryCache.set(bookmark.id, bookmark);
      });
      
      // Update category index
      const categories = new Set<string>();
      bookmarks.forEach(bookmark => {
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
        await bookmarkDbService.bulkPut(this.CATEGORY_STORE, categoriesToAdd);
      }
      
      // Clear search cache after bulk updates
      this.clearSearchCache();
    } catch (error) {
      console.error('Error adding bookmarks in bulk:', error);
      throw error;
    }
  }

  private clearSearchCache(): void {
    this.searchCache.clear();
  }

  async searchBookmarks(options: BookmarkSearchOptions): Promise<ChromeBookmark[]> {
    const { query, limit = 100, offset = 0, sortBy = 'relevance', sortOrder = 'desc', categoryFilter } = options;
    
    if (!query.trim() && !categoryFilter) {
      // If no query and no category filter, return recent bookmarks
      return this.getRecentBookmarks(limit, offset);
    }

    try {
      await this.initialize();
      
      // Generate cache key based on search parameters
      const cacheKey = `${query}_${limit}_${offset}_${sortBy}_${sortOrder}_${categoryFilter || ''}`;
      
      // Check cache first
      const cached = this.searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.results;
      }
      
      // Start with indices
      let indices = await bookmarkDbService.getAll<BookmarkIndex>(this.BOOKMARK_INDEX_STORE);
      
      // Apply category filter if specified
      if (categoryFilter) {
        indices = indices.filter(index => index.category === categoryFilter.toLowerCase());
      }
      
      // If no query, just filter by category and sort
      if (!query.trim()) {
        const sortedIndices = this.sortIndices(indices, sortBy, sortOrder);
        const paginatedIds = sortedIndices.slice(offset, offset + limit).map(index => index.id);
        
        // Get full bookmarks for matching IDs
        const bookmarks = await Promise.all(
          paginatedIds.map(id => this.getBookmark(id))
        );
        
        const results = bookmarks.filter((bookmark): bookmark is ChromeBookmark => bookmark !== null);
        
        // Cache the results
        this.searchCache.set(cacheKey, { results, timestamp: Date.now() });
        
        return results;
      }
      
      // Apply full text search with query
      const queryWords = query.toLowerCase().trim().split(/\s+/);
      
      // Score and filter indices
      const scoredIndices = indices
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
          
          return { id: index.id, score, index };
        })
        .filter(result => result.score > 0);
      
      // Sort by score or other criteria
      if (sortBy === 'relevance') {
        scoredIndices.sort((a, b) => sortOrder === 'desc' ? b.score - a.score : a.score - b.score);
      } else {
        this.sortScoredIndices(scoredIndices, sortBy, sortOrder);
      }
      
      // Apply pagination
      const paginatedIds = scoredIndices.slice(offset, offset + limit).map(result => result.id);
      
      // Get full bookmarks for matching IDs
      const bookmarks = await Promise.all(
        paginatedIds.map(id => this.getBookmark(id))
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
  
  private sortScoredIndices(
    scoredIndices: Array<{ id: string; score: number; index: BookmarkIndex }>,
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): void {
    switch (sortBy) {
      case 'title':
        scoredIndices.sort((a, b) => {
          return sortOrder === 'asc' 
            ? a.index.title.localeCompare(b.index.title)
            : b.index.title.localeCompare(a.index.title);
        });
        break;
      case 'dateAdded':
        scoredIndices.sort((a, b) => {
          return sortOrder === 'asc' 
            ? (a.index.dateAdded || 0) - (b.index.dateAdded || 0)
            : (b.index.dateAdded || 0) - (a.index.dateAdded || 0);
        });
        break;
      case 'category':
        scoredIndices.sort((a, b) => {
          const catA = a.index.category || '';
          const catB = b.index.category || '';
          return sortOrder === 'asc' 
            ? catA.localeCompare(catB)
            : catB.localeCompare(catA);
        });
        break;
      // For relevance, we keep the existing sort by score
    }
  }

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
      const bookmarks = await bookmarkDbService.getAll<ChromeBookmark>(this.BOOKMARKS_STORE, {
        index: 'dateAdded',
        order: 'desc',
        limit,
        offset
      });
      
      return bookmarks;
    } catch (error) {
      console.error('Error getting recent bookmarks:', error);
      return [];
    }
  }

  async updateBookmark(bookmark: ChromeBookmark): Promise<void> {
    try {
      await this.initialize();
      
      await Promise.all([
        bookmarkDbService.put(this.BOOKMARKS_STORE, bookmark),
        bookmarkDbService.put(this.BOOKMARK_INDEX_STORE, this.createBookmarkIndex(bookmark))
      ]);
      
      // Update memory cache
      this.memoryCache.set(bookmark.id, bookmark);
      
      // Add to category index if needed
      if (bookmark.category && !this.categoryCache.has(bookmark.category)) {
        this.categoryCache.set(bookmark.category, []);
        await bookmarkDbService.put(this.CATEGORY_STORE, {
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

  async deleteBookmark(id: string): Promise<void> {
    try {
      await this.initialize();
      
      // Get the bookmark to check its category
      const bookmark = await this.getBookmark(id);
      
      await Promise.all([
        bookmarkDbService.delete(this.BOOKMARKS_STORE, id),
        bookmarkDbService.delete(this.BOOKMARK_INDEX_STORE, id)
      ]);
      
      // Remove from memory cache
      this.memoryCache.delete(id);
      
      this.clearSearchCache();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw error;
    }
  }

  async getBookmark(id: string): Promise<ChromeBookmark | null> {
    try {
      await this.initialize();
      
      // Check memory cache first for instant access
      if (this.memoryCache.has(id)) {
        return this.memoryCache.get(id) || null;
      }
      
      // If not in memory, get from database
      const bookmark = await bookmarkDbService.get<ChromeBookmark>(this.BOOKMARKS_STORE, id);
      
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

  async getAllBookmarks(options: { limit?: number; offset?: number } = {}): Promise<ChromeBookmark[]> {
    try {
      await this.initialize();
      
      const { limit, offset } = options;
      
      return await bookmarkDbService.getAll<ChromeBookmark>(this.BOOKMARKS_STORE, { 
        limit, 
        offset,
        index: 'dateAdded',
        order: 'desc'
      });
    } catch (error) {
      console.error('Error getting all bookmarks:', error);
      return [];
    }
  }
  
  async getAllCategories(): Promise<string[]> {
    try {
      await this.initialize();
      
      const categories = await bookmarkDbService.getAll<{id: string, name: string}>(this.CATEGORY_STORE);
      return categories.map(category => category.name);
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }
  
  async getBookmarkCount(): Promise<number> {
    try {
      await this.initialize();
      return await bookmarkDbService.count(this.BOOKMARKS_STORE);
    } catch (error) {
      console.error('Error getting bookmark count:', error);
      return 0;
    }
  }
  
  async syncFromChromeBookmarks(options: SyncOptions = {}): Promise<ChromeBookmark[]> {
    try {
      await this.initialize();
      
      // If Chrome bookmarks API isn't available, return current bookmarks
      if (!chrome.bookmarks) {
        const bookmarks = await this.getAllBookmarks();
        return bookmarks;
      }
      
      const { forceRefresh = false, onProgress, onBatchComplete } = options;
      
      // If force refresh, clear existing data
      if (forceRefresh) {
        await Promise.all([
          bookmarkDbService.clear(this.BOOKMARKS_STORE),
          bookmarkDbService.clear(this.BOOKMARK_INDEX_STORE)
        ]);
        this.memoryCache.clear();
        this.clearSearchCache();
      }
      
      // Get all bookmarks from Chrome
      const chromeBookmarks = await this.getAllChromeBookmarks();
      let totalProcessed = 0;
      const allProcessedBookmarks: ChromeBookmark[] = [];
      
      // Process in batches
      for (let i = 0; i < chromeBookmarks.length; i += BATCH_SIZE) {
        const batch = chromeBookmarks.slice(i, i + BATCH_SIZE);
        const processedBatch: ChromeBookmark[] = [];
        
        // Process each bookmark in the batch
        for (const chromeBookmark of batch) {
          if (!chromeBookmark.id || !chromeBookmark.title) continue;
          
          try {
            // Get existing bookmark to preserve categories
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
            
            processedBatch.push(bookmark);
          } catch (error) {
            console.error('Error processing Chrome bookmark:', error);
          }
        }
        
        // Bulk add the batch
        await this.addBookmarks(processedBatch);
        
        // Update progress
        totalProcessed += processedBatch.length;
        allProcessedBookmarks.push(...processedBatch);
        
        if (onProgress) {
          const progress = Math.min(100, Math.round((totalProcessed / chromeBookmarks.length) * 100));
          onProgress(progress);
        }
        
        if (onBatchComplete) {
          onBatchComplete(processedBatch);
        }
      }
      
      console.log(`Synced ${totalProcessed} bookmarks from Chrome`);
      return allProcessedBookmarks;
    } catch (error) {
      console.error('Error syncing from Chrome bookmarks:', error);
      toast.error('Failed to sync bookmarks from Chrome');
      return [];
    }
  }
  
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
  
  async prefixSearch(prefix: string, limit = 10): Promise<ChromeBookmark[]> {
    if (!prefix.trim()) return [];

    try {
      await this.initialize();
      
      const indices = await bookmarkDbService.getAll<BookmarkIndex>(this.BOOKMARK_INDEX_STORE);
      const normalizedPrefix = prefix.toLowerCase().trim();
      
      // Find matches based on prefix
      const matchingIds = indices
        .filter(index => 
          index.title.startsWith(normalizedPrefix) ||
          index.url?.includes(normalizedPrefix) ||
          index.category?.startsWith(normalizedPrefix)
        )
        .sort((a, b) => {
          // Sort by relevance: title matches first, then URL, then category
          const aTitle = a.title.startsWith(normalizedPrefix) ? 3 : 0;
          const bTitle = b.title.startsWith(normalizedPrefix) ? 3 : 0;
          
          const aUrl = a.url?.includes(normalizedPrefix) ? 2 : 0;
          const bUrl = b.url?.includes(normalizedPrefix) ? 2 : 0;
          
          const aCategory = a.category?.startsWith(normalizedPrefix) ? 1 : 0;
          const bCategory = b.category?.startsWith(normalizedPrefix) ? 1 : 0;
          
          const aScore = aTitle + aUrl + aCategory;
          const bScore = bTitle + bUrl + bCategory;
          
          return bScore - aScore;
        })
        .slice(0, limit)
        .map(index => index.id);
      
      // Get full bookmarks for matching IDs
      const bookmarks = await Promise.all(
        matchingIds.map(id => this.getBookmark(id))
      );
      
      return bookmarks.filter((bookmark): bookmark is ChromeBookmark => bookmark !== null);
    } catch (error) {
      console.error('Error searching bookmarks by prefix:', error);
      return [];
    }
  }
  
  async clear(): Promise<void> {
    try {
      await Promise.all([
        bookmarkDbService.clear(this.BOOKMARKS_STORE),
        bookmarkDbService.clear(this.BOOKMARK_INDEX_STORE)
      ]);
      
      this.memoryCache.clear();
      this.clearSearchCache();
    } catch (error) {
      console.error('Error clearing bookmark storage:', error);
      throw error;
    }
  }
}

export const enhancedBookmarkStorage = EnhancedBookmarkStorage.getInstance();
