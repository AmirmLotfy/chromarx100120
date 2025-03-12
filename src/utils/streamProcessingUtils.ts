
import { ChromeBookmark } from "@/types/bookmark";
import { optimizedBookmarkStorage } from "@/services/optimizedBookmarkStorage";

interface ProcessingOptions {
  chunkSize?: number;
  pauseBetweenChunks?: number;
  onProgress?: (progress: number) => void;
  onChunkProcessed?: (chunk: ChromeBookmark[]) => void;
  filter?: (bookmark: ChromeBookmark) => boolean;
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
    filter
  } = options;

  const filteredItems = filter ? items.filter(filter as any) : items;
  const totalItems = filteredItems.length;
  let processedCount = 0;

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
    
    // Process bookmarks in chunks for better UI responsiveness
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
  } catch (error) {
    console.error('Error in background indexing:', error);
    throw error;
  }
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
