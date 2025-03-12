
import { ChromeBookmark } from "@/types/bookmark";
import { optimizedBookmarkStorage } from "@/services/optimizedBookmarkStorage";

interface ProcessingOptions {
  chunkSize?: number;
  pauseBetweenChunks?: number;
  onProgress?: (progress: number) => void;
  onChunkProcessed?: (chunk: ChromeBookmark[]) => void;
  filter?: (bookmark: ChromeBookmark) => boolean;
  prioritizeVisible?: boolean;
  useWorker?: boolean;
}

/**
 * Process bookmarks in a streaming fashion to avoid UI blocking
 */
export async function streamProcess<T>(
  items: T[],
  processItem: (item: T, index: number) => Promise<void> | void,
  options: ProcessingOptions = {}
): Promise<void> {
  const {
    chunkSize = 50,
    pauseBetweenChunks = 0,
    onProgress,
    filter,
    prioritizeVisible = false,
    useWorker = false
  } = options;

  const filteredItems = filter ? items.filter(filter as any) : items;
  const totalItems = filteredItems.length;
  let processedCount = 0;

  // No items to process
  if (totalItems === 0) return;

  // Process items that should be prioritized first (like visible items)
  if (prioritizeVisible && options.filter) {
    const visibleItems = items.filter(options.filter as any);
    await Promise.all(visibleItems.map((item, idx) => processItem(item, idx)));
    processedCount += visibleItems.length;
    
    // Report progress after processing visible items
    if (onProgress) {
      onProgress(Math.floor((processedCount / totalItems) * 100));
    }
  }

  // Check if we should use Web Worker for processing
  if (useWorker && typeof Worker !== 'undefined' && window.isSecureContext) {
    await processWithWorker(filteredItems, processItem, { 
      chunkSize, 
      onProgress, 
      processedCount, 
      totalItems 
    });
    return;
  }

  // Process in chunks
  for (let i = 0; i < totalItems; i += chunkSize) {
    const chunk = filteredItems.slice(i, Math.min(i + chunkSize, totalItems));
    
    // Process current chunk
    await Promise.all(chunk.map(
      (item, idx) => processItem(item, i + idx)
    ));
    
    processedCount += chunk.length;
    
    // Report progress
    if (onProgress) {
      onProgress(Math.floor((processedCount / totalItems) * 100));
    }
    
    // Allow UI to update between chunks
    if (pauseBetweenChunks > 0 && i + chunkSize < totalItems) {
      await new Promise(resolve => setTimeout(resolve, pauseBetweenChunks));
    }
    
    // Call chunk callback if provided
    if (options.onChunkProcessed) {
      options.onChunkProcessed(chunk as unknown as ChromeBookmark[]);
    }
  }
}

/**
 * Use a web worker to process items
 */
async function processWithWorker<T>(
  items: T[],
  processItem: (item: T, index: number) => Promise<void> | void,
  options: {
    chunkSize: number;
    onProgress?: (progress: number) => void;
    processedCount: number;
    totalItems: number;
  }
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Create a worker inline to avoid file loading issues
      const workerCode = `
        self.onmessage = async function(e) {
          const { items, processedCount, totalItems, chunkSize } = e.data;
          let processed = processedCount;
          
          for (let i = 0; i < items.length; i += chunkSize) {
            const chunk = items.slice(i, Math.min(i + chunkSize, items.length));
            
            // Process chunk
            await Promise.all(chunk.map((item, idx) => {
              // Simple processing in worker - complex logic handled in main thread
              return Promise.resolve();
            }));
            
            processed += chunk.length;
            
            // Report progress back to main thread
            self.postMessage({
              type: 'progress',
              progress: Math.floor((processed / totalItems) * 100),
              processedCount: processed,
              chunk: chunk,
              chunkIndex: i
            });
            
            // Small pause to prevent blocking
            await new Promise(resolve => setTimeout(resolve, 1));
          }
          
          self.postMessage({ type: 'complete' });
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      worker.onmessage = async (e) => {
        const { type, progress, chunk, chunkIndex } = e.data;
        
        if (type === 'progress') {
          if (options.onProgress) {
            options.onProgress(progress);
          }
          
          // Process each chunk in the main thread
          if (chunk) {
            await Promise.all(chunk.map(
              (item, idx) => processItem(item, chunkIndex + idx)
            ));
          }
        } else if (type === 'complete') {
          worker.terminate();
          resolve();
        }
      };
      
      worker.onerror = (error) => {
        console.error('Worker error:', error);
        worker.terminate();
        reject(error);
      };
      
      // Start the worker
      worker.postMessage({
        items,
        processedCount: options.processedCount,
        totalItems: options.totalItems,
        chunkSize: options.chunkSize
      });
    } catch (error) {
      console.error('Error starting worker:', error);
      reject(error);
    }
  });
}

/**
 * Process and index bookmarks in background
 */
export async function backgroundIndexBookmarks(
  bookmarks: ChromeBookmark[],
  onProgress?: (progress: number) => void
): Promise<void> {
  const chunkSize = 100; 
  const totalBookmarks = bookmarks.length;
  
  try {
    if (totalBookmarks === 0) return;
    
    // Detect if worker is available
    const useWorker = typeof Worker !== 'undefined' && window.isSecureContext;
    
    // Process bookmarks in chunks for better UI responsiveness
    if (useWorker) {
      await streamProcess(
        bookmarks, 
        async (bookmark) => {
          await optimizedBookmarkStorage.addBookmark(bookmark);
        },
        {
          chunkSize,
          onProgress,
          useWorker: true
        }
      );
    } else {
      // Fallback to standard chunking
      for (let i = 0; i < totalBookmarks; i += chunkSize) {
        const chunk = bookmarks.slice(i, Math.min(i + chunkSize, totalBookmarks));
        
        // Store chunk in IndexedDB
        await optimizedBookmarkStorage.addBookmarks(chunk);
        
        // Update progress
        if (onProgress) {
          onProgress(Math.floor((i + chunk.length) / totalBookmarks * 100));
        }
        
        // Allow UI thread to breathe
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  } catch (error) {
    console.error('Error in background indexing:', error);
    throw error;
  }
}

/**
 * Process bookmarks with visual items prioritized
 */
export async function prioritizedBookmarkProcessing(
  allBookmarks: ChromeBookmark[],
  visibleBookmarks: ChromeBookmark[],
  processItem: (bookmark: ChromeBookmark) => Promise<void>,
  onProgress?: (progress: number) => void
): Promise<void> {
  // Create a set of visible bookmark IDs for quick lookup
  const visibleIds = new Set(visibleBookmarks.map(b => b.id));
  
  // First process visible bookmarks
  if (visibleBookmarks.length > 0) {
    await Promise.all(visibleBookmarks.map(bookmark => processItem(bookmark)));
    
    if (onProgress) {
      onProgress(Math.floor((visibleBookmarks.length / allBookmarks.length) * 10)); // 10% progress for visible
    }
  }
  
  // Then process non-visible bookmarks
  const nonVisibleBookmarks = allBookmarks.filter(bookmark => !visibleIds.has(bookmark.id));
  
  // Process remaining bookmarks in chunks
  await streamProcess(
    nonVisibleBookmarks,
    async (bookmark) => {
      await processItem(bookmark);
    },
    {
      chunkSize: 50,
      pauseBetweenChunks: 5,
      onProgress: nonVisibleProgress => {
        if (onProgress) {
          // Scales from 10% to 100% after visible bookmarks are processed
          const scaledProgress = 10 + Math.floor(nonVisibleProgress * 0.9);
          onProgress(scaledProgress);
        }
      },
      useWorker: typeof Worker !== 'undefined' && window.isSecureContext
    }
  );
}

// Function for processing bookmarks in a WebWorker
export function prepareWebWorkerData(bookmarks: ChromeBookmark[]): any[] {
  // Prepare a simplified version of bookmarks for the worker
  return bookmarks.map(bookmark => ({
    id: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    dateAdded: bookmark.dateAdded || Date.now(),
    category: bookmark.category
  }));
}
