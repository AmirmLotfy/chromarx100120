
import { createReadableStream, createTransformStream } from './webStreamUtils';
import { storage } from '@/services/storage';

/**
 * BookmarkStreamProcessor provides optimized stream processing for bookmarks
 * with better integration between IndexedDB and Streams API
 */
export class BookmarkStreamProcessor {
  /**
   * Process bookmarks using streams with automatic IndexedDB storage
   */
  static async processBookmarks<T, R>(
    bookmarks: T[],
    processFn: (bookmark: T) => Promise<R>,
    options: {
      batchSize?: number;
      storageKey?: string;
      onProgress?: (progress: number) => void;
      shouldStore?: boolean;
    } = {}
  ): Promise<R[]> {
    const {
      batchSize = 5,
      storageKey = 'processed_bookmarks',
      onProgress,
      shouldStore = true
    } = options;
    
    const results: R[] = [];
    
    // Create a readable stream from the bookmarks array
    const readableStream = createReadableStream(bookmarks);
    
    // Create a transform stream to process each bookmark
    const transformStream = createTransformStream(async (bookmark: T) => {
      try {
        const result = await processFn(bookmark);
        return result;
      } catch (error) {
        console.error('Error processing bookmark:', error);
        throw error;
      }
    });
    
    // Create a writable stream to collect results and store in IndexedDB
    const writableStream = new WritableStream({
      write: async (result: R) => {
        results.push(result);
        
        // Optionally store each processed result in IndexedDB
        if (shouldStore) {
          try {
            const storedData = await storage.get(storageKey) || [];
            storedData.push(result);
            await storage.set(storageKey, storedData);
          } catch (error) {
            console.error('Error storing in IndexedDB:', error);
          }
        }
      }
    });
    
    // Connect the streams
    await readableStream
      .pipeThrough(transformStream)
      .pipeTo(writableStream);
    
    return results;
  }
  
  /**
   * Stream data from IndexedDB and process it with a transform function
   */
  static async streamFromIndexedDB<T, R>(
    storageKey: string,
    transformFn: (item: T) => Promise<R>,
    options: {
      batchSize?: number;
      onProgress?: (progress: number) => void;
      filter?: (item: T) => boolean;
    } = {}
  ): Promise<R[]> {
    const { batchSize = 10, onProgress, filter } = options;
    
    // Get data from IndexedDB
    const data = await storage.get(storageKey) || [];
    const filteredData = filter ? data.filter(filter) : data;
    
    return this.processBookmarks(
      filteredData,
      transformFn,
      { 
        batchSize,
        onProgress,
        shouldStore: false
      }
    );
  }
  
  /**
   * Perform a batch update operation on IndexedDB-stored bookmarks
   */
  static async batchUpdate<T>(
    storageKey: string,
    updateFn: (items: T[]) => Promise<T[]>,
    options: {
      batchSize?: number;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<void> {
    const { batchSize = 20, onProgress } = options;
    
    // Get all items from storage
    const allItems = await storage.get(storageKey) || [];
    
    // Process in batches
    const totalBatches = Math.ceil(allItems.length / batchSize);
    const updatedItems: T[] = [];
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, allItems.length);
      const batch = allItems.slice(start, end);
      
      // Update the batch
      const updatedBatch = await updateFn(batch);
      updatedItems.push(...updatedBatch);
      
      // Report progress
      if (onProgress) {
        onProgress((i + 1) / totalBatches);
      }
    }
    
    // Save updated items
    await storage.set(storageKey, updatedItems);
  }
  
  /**
   * Stream and filter bookmarks with real-time processing
   */
  static createBookmarkFilterStream<T>(
    filterFn: (bookmark: T) => boolean
  ): TransformStream<T, T> {
    return new TransformStream({
      transform(bookmark, controller) {
        if (filterFn(bookmark)) {
          controller.enqueue(bookmark);
        }
      }
    });
  }
}

// Export some helper functions for convenience
export const processBookmarksWithStreams = BookmarkStreamProcessor.processBookmarks;
export const streamBookmarksFromDB = BookmarkStreamProcessor.streamFromIndexedDB;
export const batchUpdateBookmarks = BookmarkStreamProcessor.batchUpdate;
