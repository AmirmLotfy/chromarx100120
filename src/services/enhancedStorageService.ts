import { storage } from './storage/unifiedStorage';

// Stream processing types
interface ProcessingStream<T, R> {
  source: ReadableStream<T>;
  transform?: TransformStream<T, R>;
  sink: WritableStream<R>;
}

/**
 * Enhanced Storage Service that leverages IndexedDB and the Streams API
 * for efficient data processing and storage.
 */
class EnhancedStorageService {
  private dbName = 'chromarx-db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private stores = {
    bookmarks: 'bookmarks',
    metadata: 'bookmark-metadata',
    summaries: 'summaries',
    categories: 'categories',
    tags: 'tags',
    syncQueue: 'sync-queue'
  };

  /**
   * Initialize the database
   */
  async initialize(): Promise<boolean> {
    if (this.db) {
      return true;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Error opening database:', event);
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('Database opened successfully');
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(this.stores.bookmarks)) {
          const bookmarkStore = db.createObjectStore(this.stores.bookmarks, { keyPath: 'id' });
          bookmarkStore.createIndex('url', 'url', { unique: false });
          bookmarkStore.createIndex('dateAdded', 'dateAdded', { unique: false });
          bookmarkStore.createIndex('parentId', 'parentId', { unique: false });
          bookmarkStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.stores.metadata)) {
          const metadataStore = db.createObjectStore(this.stores.metadata, { keyPath: 'id' });
          metadataStore.createIndex('bookmarkId', 'bookmarkId', { unique: true });
          metadataStore.createIndex('category', 'category', { unique: false });
          metadataStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        if (!db.objectStoreNames.contains(this.stores.summaries)) {
          const summaryStore = db.createObjectStore(this.stores.summaries, { keyPath: 'id' });
          summaryStore.createIndex('bookmarkId', 'bookmarkId', { unique: true });
          summaryStore.createIndex('dateCreated', 'dateCreated', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.stores.categories)) {
          db.createObjectStore(this.stores.categories, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(this.stores.tags)) {
          const tagStore = db.createObjectStore(this.stores.tags, { keyPath: 'id' });
          tagStore.createIndex('name', 'name', { unique: true });
        }

        if (!db.objectStoreNames.contains(this.stores.syncQueue)) {
          const syncQueueStore = db.createObjectStore(this.stores.syncQueue, { keyPath: 'id' });
          syncQueueStore.createIndex('status', 'status', { unique: false });
          syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Create a processing stream for efficient data handling
   */
  createProcessingStream<T, R>(
    sourceData: T[],
    processFn: (chunk: T) => Promise<R>,
    options: {
      chunkSize?: number;
      concurrency?: number;
      onProgress?: (processed: number, total: number) => void;
    } = {}
  ): ProcessingStream<T, R> {
    const { chunkSize = 10, concurrency = 5, onProgress } = options;
    const total = sourceData.length;
    let processed = 0;

    // Create source stream
    const source = new ReadableStream<T>({
      start(controller) {
        // Add all data to the stream
        for (const item of sourceData) {
          controller.enqueue(item);
        }
        controller.close();
      }
    });

    // Create transform stream for processing
    const transform = new TransformStream<T, R>({
      async transform(chunk, controller) {
        try {
          const result = await processFn(chunk);
          controller.enqueue(result);
          
          processed++;
          if (onProgress) {
            onProgress(processed, total);
          }
        } catch (error) {
          console.error('Error processing chunk:', error);
          // We don't rethrow to keep the stream alive
        }
      }
    });

    // Create sink stream for storing results
    const sink = new WritableStream<R>({
      write(chunk) {
        // This is a no-op sink - actual storage happens elsewhere
        return Promise.resolve();
      }
    });

    return { source, transform, sink };
  }

  /**
   * Process data with streams and store results
   */
  async processWithStreams<T, R>(
    data: T[],
    processFn: (item: T) => Promise<R>,
    storeFn: (results: R[]) => Promise<void>,
    options: {
      chunkSize?: number;
      concurrency?: number;
      onProgress?: (processed: number, total: number) => void;
    } = {}
  ): Promise<R[]> {
    await this.initialize();

    const results: R[] = [];
    const { source, transform, sink } = this.createProcessingStream(data, processFn, options);

    // Connect the streams
    const reader = source
      .pipeThrough(transform!)
      .getReader();

    // Read all results
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) results.push(value);
    }

    // Store the results
    await storeFn(results);

    return results;
  }

  /**
   * Add or update bookmarks in bulk with efficient stream processing
   */
  async bulkAddOrUpdateBookmarks(bookmarks: any[]): Promise<void> {
    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Process bookmarks in chunks using streams
    await this.processWithStreams(
      bookmarks,
      async (bookmark) => {
        // Check if bookmark exists
        const existingBookmark = await this.getBookmark(bookmark.id);
        
        // Prepare for storage
        const bookmarkToStore = existingBookmark 
          ? { ...existingBookmark, ...bookmark, lastModified: Date.now() }
          : { ...bookmark, dateAdded: bookmark.dateAdded || Date.now(), lastModified: Date.now() };
        
        return bookmarkToStore;
      },
      async (processedBookmarks) => {
        // Store the processed bookmarks in a single transaction
        const transaction = this.db!.transaction([this.stores.bookmarks], 'readwrite');
        const store = transaction.objectStore(this.stores.bookmarks);
        
        const promises = processedBookmarks.map(bookmark => {
          return new Promise<void>((resolve, reject) => {
            const request = store.put(bookmark);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        });
        
        await Promise.all(promises);
      },
      {
        chunkSize: 50,
        onProgress: (processed, total) => {
          console.log(`Processed ${processed}/${total} bookmarks`);
        }
      }
    );
  }

  /**
   * Get a bookmark by ID
   */
  async getBookmark(id: string): Promise<any | null> {
    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.bookmarks], 'readonly');
      const store = transaction.objectStore(this.stores.bookmarks);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get all bookmarks with optional filtering
   */
  async getAllBookmarks(filter?: (bookmark: any) => boolean): Promise<any[]> {
    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.bookmarks], 'readonly');
      const store = transaction.objectStore(this.stores.bookmarks);
      const request = store.getAll();

      request.onsuccess = () => {
        let bookmarks = request.result || [];
        if (filter) {
          bookmarks = bookmarks.filter(filter);
        }
        resolve(bookmarks);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Delete bookmarks by ID
   */
  async deleteBookmarks(ids: string[]): Promise<void> {
    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.stores.bookmarks, this.stores.metadata, this.stores.summaries], 'readwrite');
    const bookmarkStore = transaction.objectStore(this.stores.bookmarks);
    const metadataStore = transaction.objectStore(this.stores.metadata);
    const summaryStore = transaction.objectStore(this.stores.summaries);

    const promises = ids.flatMap(id => [
      new Promise<void>((resolve, reject) => {
        const request = bookmarkStore.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve) => {
        // Delete associated metadata - use index to find by bookmarkId
        const metadataIndex = metadataStore.index('bookmarkId');
        const metadataRequest = metadataIndex.getKey(id);
        
        metadataRequest.onsuccess = () => {
          if (metadataRequest.result) {
            metadataStore.delete(metadataRequest.result);
          }
          resolve();
        };
        
        metadataRequest.onerror = () => {
          console.error('Error deleting metadata:', metadataRequest.error);
          resolve(); // Continue even if there's an error
        };
      }),
      new Promise<void>((resolve) => {
        // Delete associated summary - use index to find by bookmarkId
        const summaryIndex = summaryStore.index('bookmarkId');
        const summaryRequest = summaryIndex.getKey(id);
        
        summaryRequest.onsuccess = () => {
          if (summaryRequest.result) {
            summaryStore.delete(summaryRequest.result);
          }
          resolve();
        };
        
        summaryRequest.onerror = () => {
          console.error('Error deleting summary:', summaryRequest.error);
          resolve(); // Continue even if there's an error
        };
      })
    ]);

    await Promise.all(promises);
  }

  /**
   * Store bookmark summaries
   */
  async storeBookmarkSummaries(summaries: any[]): Promise<void> {
    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.stores.summaries], 'readwrite');
    const store = transaction.objectStore(this.stores.summaries);

    const promises = summaries.map(summary => {
      return new Promise<void>((resolve, reject) => {
        // Ensure summary has required fields
        const summaryToStore = {
          ...summary,
          id: summary.id || `sum_${summary.bookmarkId}_${Date.now()}`,
          dateCreated: summary.dateCreated || Date.now(),
          lastModified: Date.now()
        };
        
        const request = store.put(summaryToStore);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }

  /**
   * Search bookmarks with full-text capabilities
   */
  async searchBookmarks(query: string, options: {
    fields?: string[];
    limit?: number;
    includeMetadata?: boolean;
    includeSummaries?: boolean;
  } = {}): Promise<any[]> {
    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const { 
      fields = ['title', 'url', 'description'], 
      limit = 100,
      includeMetadata = false,
      includeSummaries = false
    } = options;

    // Get all bookmarks to search
    const allBookmarks = await this.getAllBookmarks();
    
    // Prepare search terms
    const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
    
    if (searchTerms.length === 0) {
      return allBookmarks.slice(0, limit);
    }
    
    // Filter bookmarks by search terms
    const matchedBookmarks = allBookmarks.filter(bookmark => {
      return searchTerms.some(term => {
        return fields.some(field => {
          const value = bookmark[field];
          return value && value.toString().toLowerCase().includes(term);
        });
      });
    }).slice(0, limit);
    
    // If metadata or summaries are requested, fetch them
    if (includeMetadata || includeSummaries) {
      const bookmarkIds = matchedBookmarks.map(b => b.id);
      
      // Get metadata if requested
      if (includeMetadata) {
        const metadata = await this.getMetadataForBookmarks(bookmarkIds);
        
        // Merge metadata with bookmarks
        matchedBookmarks.forEach(bookmark => {
          bookmark.metadata = metadata.find(m => m.bookmarkId === bookmark.id) || null;
        });
      }
      
      // Get summaries if requested
      if (includeSummaries) {
        const summaries = await this.getSummariesForBookmarks(bookmarkIds);
        
        // Merge summaries with bookmarks
        matchedBookmarks.forEach(bookmark => {
          bookmark.summary = summaries.find(s => s.bookmarkId === bookmark.id) || null;
        });
      }
    }
    
    return matchedBookmarks;
  }

  /**
   * Get metadata for multiple bookmarks
   */
  private async getMetadataForBookmarks(bookmarkIds: string[]): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.metadata], 'readonly');
      const store = transaction.objectStore(this.stores.metadata);
      const index = store.index('bookmarkId');
      const results: any[] = [];
      
      let completed = 0;
      
      bookmarkIds.forEach(bookmarkId => {
        const request = index.get(bookmarkId);
        
        request.onsuccess = () => {
          if (request.result) {
            results.push(request.result);
          }
          
          completed++;
          if (completed === bookmarkIds.length) {
            resolve(results);
          }
        };
        
        request.onerror = () => {
          console.error(`Error getting metadata for bookmark ${bookmarkId}:`, request.error);
          completed++;
          if (completed === bookmarkIds.length) {
            resolve(results);
          }
        };
      });
      
      // Handle empty array case
      if (bookmarkIds.length === 0) {
        resolve([]);
      }
    });
  }

  /**
   * Get summaries for multiple bookmarks
   */
  private async getSummariesForBookmarks(bookmarkIds: string[]): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.summaries], 'readonly');
      const store = transaction.objectStore(this.stores.summaries);
      const index = store.index('bookmarkId');
      const results: any[] = [];
      
      let completed = 0;
      
      bookmarkIds.forEach(bookmarkId => {
        const request = index.get(bookmarkId);
        
        request.onsuccess = () => {
          if (request.result) {
            results.push(request.result);
          }
          
          completed++;
          if (completed === bookmarkIds.length) {
            resolve(results);
          }
        };
        
        request.onerror = () => {
          console.error(`Error getting summary for bookmark ${bookmarkId}:`, request.error);
          completed++;
          if (completed === bookmarkIds.length) {
            resolve(results);
          }
        };
      });
      
      // Handle empty array case
      if (bookmarkIds.length === 0) {
        resolve([]);
      }
    });
  }

  /**
   * Add items to the sync queue
   */
  async addToSyncQueue(items: any[]): Promise<void> {
    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction([this.stores.syncQueue], 'readwrite');
    const store = transaction.objectStore(this.stores.syncQueue);

    const promises = items.map(item => {
      return new Promise<void>((resolve, reject) => {
        const itemToStore = {
          ...item,
          id: item.id || `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          timestamp: Date.now(),
          retryCount: 0
        };
        
        const request = store.put(itemToStore);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }

  /**
   * Process the sync queue
   */
  async processSyncQueue(processFn: (item: any) => Promise<any>): Promise<{
    processed: number;
    failed: number;
    pending: number;
  }> {
    await this.initialize();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Get pending items from the queue
    const transaction = this.db.transaction([this.stores.syncQueue], 'readonly');
    const store = transaction.objectStore(this.stores.syncQueue);
    const index = store.index('status');
    const request = index.getAll('pending');
    
    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const pendingItems = request.result || [];
        
        if (pendingItems.length === 0) {
          resolve({ processed: 0, failed: 0, pending: 0 });
          return;
        }
        
        let processed = 0;
        let failed = 0;
        
        // Process items with streams
        await this.processWithStreams(
          pendingItems,
          async (item) => {
            try {
              const result = await processFn(item);
              processed++;
              return {
                ...item,
                status: 'completed',
                processedAt: Date.now(),
                result
              };
            } catch (error) {
              failed++;
              return {
                ...item,
                status: item.retryCount >= 3 ? 'failed' : 'pending',
                lastError: error instanceof Error ? error.message : String(error),
                retryCount: (item.retryCount || 0) + 1
              };
            }
          },
          async (results) => {
            // Update the sync queue with processed items
            const updateTransaction = this.db!.transaction([this.stores.syncQueue], 'readwrite');
            const updateStore = updateTransaction.objectStore(this.stores.syncQueue);
            
            const updatePromises = results.map(item => {
              return new Promise<void>((resolveUpdate, rejectUpdate) => {
                const updateRequest = updateStore.put(item);
                updateRequest.onsuccess = () => resolveUpdate();
                updateRequest.onerror = () => rejectUpdate(updateRequest.error);
              });
            });
            
            await Promise.all(updatePromises);
          }
        );
        
        // Get remaining pending count
        const remainingTransaction = this.db!.transaction([this.stores.syncQueue], 'readonly');
        const remainingStore = remainingTransaction.objectStore(this.stores.syncQueue);
        const remainingIndex = remainingStore.index('status');
        const remainingRequest = remainingIndex.count('pending');
        
        remainingRequest.onsuccess = () => {
          resolve({
            processed,
            failed,
            pending: remainingRequest.result
          });
        };
        
        remainingRequest.onerror = () => {
          reject(remainingRequest.error);
        };
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear the database
   */
  async clearDatabase(): Promise<void> {
    // Close any existing connection
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      
      request.onsuccess = () => {
        console.log('Database deleted successfully');
        resolve();
      };
      
      request.onerror = () => {
        console.error('Error deleting database:', request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const enhancedStorage = new EnhancedStorageService();
export default enhancedStorage;
