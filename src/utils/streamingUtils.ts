
/**
 * A collection of utilities for working with the Streams API
 * Provides methods for efficiently processing data in streams
 */

/**
 * Creates a readable stream from an array of items
 * 
 * @param items Array of items to stream
 * @param options Configuration options
 * @returns A ReadableStream of the items
 */
export function createArrayStream<T>(
  items: T[], 
  options: {
    chunkSize?: number;
    delay?: number;
    signal?: AbortSignal;
  } = {}
): ReadableStream<T> {
  const chunkSize = options.chunkSize || 100;
  const delay = options.delay || 0;
  
  return new ReadableStream<T>({
    start(controller) {
      let index = 0;
      
      function push() {
        // Check if aborted
        if (options.signal?.aborted) {
          controller.error(new DOMException("Stream aborted", "AbortError"));
          return;
        }
        
        // Check if we've processed all items
        if (index >= items.length) {
          controller.close();
          return;
        }
        
        // Process the next chunk
        const chunk = items.slice(index, index + chunkSize);
        
        // Enqueue each item in the chunk
        for (const item of chunk) {
          controller.enqueue(item);
        }
        
        index += chunk.length;
        
        // Schedule the next chunk after a delay
        if (delay > 0 && index < items.length) {
          setTimeout(push, delay);
        } else {
          // Continue immediately if no delay
          push();
        }
      }
      
      push();
    },
    cancel(reason) {
      console.log("Array stream cancelled:", reason);
    }
  });
}

/**
 * Creates a transform stream that processes items with a provided function
 * 
 * @param processFn Function to process each item
 * @param options Configuration options
 * @returns A TransformStream that processes items
 */
export function createProcessingStream<T, R>(
  processFn: (item: T) => Promise<R | null> | R | null,
  options: {
    concurrency?: number;
    signal?: AbortSignal;
    onError?: (error: Error, item: T) => void;
  } = {}
): TransformStream<T, R> {
  const concurrency = options.concurrency || 1;
  
  return new TransformStream<T, R>({
    start() {
      // Nothing to initialize
    },
    async transform(item, controller) {
      try {
        // Check if aborted
        if (options.signal?.aborted) {
          controller.error(new DOMException("Stream aborted", "AbortError"));
          return;
        }
        
        const result = await processFn(item);
        
        // Only enqueue non-null results
        if (result !== null) {
          controller.enqueue(result);
        }
      } catch (error) {
        if (options.onError && error instanceof Error) {
          options.onError(error, item);
        } else {
          console.error("Error in processing stream:", error);
        }
      }
    },
    flush() {
      // Nothing to clean up
    }
  });
}

/**
 * Creates a transform stream that filters items
 * 
 * @param filterFn Function to test each item
 * @returns A TransformStream that only passes items that match the filter
 */
export function createFilterStream<T>(
  filterFn: (item: T) => Promise<boolean> | boolean
): TransformStream<T, T> {
  return new TransformStream<T, T>({
    async transform(item, controller) {
      try {
        const keep = await filterFn(item);
        
        if (keep) {
          controller.enqueue(item);
        }
      } catch (error) {
        console.error("Error in filter stream:", error);
      }
    }
  });
}

/**
 * Creates a writable stream that collects items into an array
 * 
 * @param resultArray Array to collect items into
 * @returns A WritableStream that collects items
 */
export function createCollectorStream<T>(
  resultArray: T[]
): WritableStream<T> {
  return new WritableStream<T>({
    write(item) {
      resultArray.push(item);
    }
  });
}

/**
 * Creates a writable stream that performs an action for each item
 * 
 * @param writeFn Function to perform for each item
 * @param options Configuration options
 * @returns A WritableStream that processes items
 */
export function createActionStream<T>(
  writeFn: (item: T) => Promise<void> | void,
  options: {
    signal?: AbortSignal;
    onError?: (error: Error, item: T) => void;
  } = {}
): WritableStream<T> {
  return new WritableStream<T>({
    async write(item) {
      try {
        // Check if aborted
        if (options.signal?.aborted) {
          throw new DOMException("Stream aborted", "AbortError");
        }
        
        await writeFn(item);
      } catch (error) {
        if (options.onError && error instanceof Error) {
          options.onError(error, item);
        } else {
          console.error("Error in action stream:", error);
        }
      }
    }
  });
}

/**
 * Creates a writable stream that reports progress
 * 
 * @param total Total number of items expected
 * @param onProgress Callback for progress updates
 * @returns A TransformStream that reports progress
 */
export function createProgressStream<T>(
  total: number,
  onProgress: (processed: number, total: number, percent: number) => void
): TransformStream<T, T> {
  let processed = 0;
  
  return new TransformStream<T, T>({
    transform(item, controller) {
      processed++;
      
      const percent = Math.round((processed / total) * 100);
      onProgress(processed, total, percent);
      
      controller.enqueue(item);
    }
  });
}

/**
 * Creates a transform stream that batches items
 * 
 * @param size Size of each batch
 * @returns A TransformStream that converts individual items to batches
 */
export function createBatchingStream<T>(size: number): TransformStream<T, T[]> {
  let batch: T[] = [];
  
  return new TransformStream<T, T[]>({
    transform(item, controller) {
      batch.push(item);
      
      if (batch.length >= size) {
        controller.enqueue([...batch]);
        batch = [];
      }
    },
    flush(controller) {
      if (batch.length > 0) {
        controller.enqueue([...batch]);
        batch = [];
      }
    }
  });
}

/**
 * Process an array through a series of stream operations
 * 
 * @param items Array of items to process
 * @param options Stream processing options
 * @returns Promise resolving to the processed results
 */
export async function streamProcess<T, R = T>(
  items: T[],
  options: {
    transform?: (item: T) => Promise<R | null> | R | null;
    filter?: (item: T) => Promise<boolean> | boolean;
    batchSize?: number;
    pauseBetweenChunks?: number;
    concurrency?: number;
    onProgress?: (processed: number, total: number, percent: number) => void;
    signal?: AbortSignal;
    collectResults?: boolean;
  } = {}
): Promise<R[]> {
  const results: R[] = [];
  const total = items.length;
  
  // Create the base readable stream from the array
  let stream = createArrayStream(items, {
    chunkSize: options.batchSize || 100,
    delay: options.pauseBetweenChunks || 0,
    signal: options.signal
  });
  
  // Add a filter if provided
  if (options.filter) {
    stream = stream.pipeThrough(createFilterStream(options.filter));
  }
  
  // Add progress reporting if needed
  if (options.onProgress) {
    stream = stream.pipeThrough(createProgressStream(
      total,
      options.onProgress
    ));
  }
  
  // Add transformation if provided
  if (options.transform) {
    stream = stream.pipeThrough(createProcessingStream(
      options.transform,
      {
        concurrency: options.concurrency || 1,
        signal: options.signal
      }
    )) as ReadableStream<R>;
  }
  
  // Only collect results if requested
  if (options.collectResults !== false) {
    await stream.pipeTo(createCollectorStream(results));
    return results;
  } else {
    // Just process without collecting
    await stream.pipeTo(new WritableStream({
      write() {
        // Do nothing with the items
      }
    }));
    return [];
  }
}

/**
 * Convenience function to process items from IndexedDB using streams
 * 
 * @param db IndexedDB database instance
 * @param storeName Name of the object store
 * @param options Processing options
 */
export async function streamProcessIndexedDb<T, R = T>(
  db: IDBDatabase,
  storeName: string,
  options: {
    transform?: (item: T) => Promise<R | null> | R | null;
    filter?: (item: T) => Promise<boolean> | boolean;
    indexName?: string;
    query?: IDBValidKey | IDBKeyRange;
    batchSize?: number;
    onProgress?: (processed: number, total: number, percent: number) => void;
    signal?: AbortSignal;
    onComplete?: (results: R[]) => void;
    collectResults?: boolean;
  } = {}
): Promise<R[]> {
  return new Promise((resolve, reject) => {
    try {
      const results: R[] = [];
      const items: T[] = [];
      
      // First retrieve all matching items
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const source = options.indexName ? store.index(options.indexName) : store;
      
      const request = source.openCursor(options.query);
      
      request.onsuccess = async (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
        
        if (cursor) {
          items.push(cursor.value as T);
          cursor.continue();
        } else {
          // Process all collected items with the streamProcess function
          try {
            const processedResults = await streamProcess<T, R>(items, {
              transform: options.transform,
              filter: options.filter,
              batchSize: options.batchSize,
              onProgress: options.onProgress,
              signal: options.signal,
              collectResults: options.collectResults
            });
            
            if (options.onComplete) {
              options.onComplete(processedResults);
            }
            
            resolve(processedResults);
          } catch (error) {
            reject(error);
          }
        }
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}
