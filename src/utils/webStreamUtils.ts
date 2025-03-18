
/**
 * WebStreamUtils: Utilities for working with the Web Streams API
 * Provides a more efficient way to process large amounts of data
 * without blocking the main thread or overloading memory
 */

import { toast } from "sonner";

/**
 * Creates a transform stream that processes data chunks
 */
export function createTransformStream<T, R>(
  transformFn: (chunk: T) => Promise<R> | R,
  options: {
    handleError?: (error: Error, chunk: T) => void;
    flush?: () => Promise<void> | void;
  } = {}
): TransformStream<T, R> {
  return new TransformStream<T, R>({
    async transform(chunk, controller) {
      try {
        const result = await transformFn(chunk);
        controller.enqueue(result);
      } catch (error) {
        console.error("Transform stream error:", error);
        
        if (options.handleError) {
          options.handleError(error as Error, chunk);
        } else {
          controller.error(error);
        }
      }
    },
    
    flush(controller) {
      if (options.flush) {
        Promise.resolve(options.flush()).catch(error => {
          console.error("Error in transform stream flush:", error);
          controller.error(error);
        });
      }
    }
  });
}

/**
 * Creates a readable stream from an array of data
 */
export function createReadableStream<T>(items: T[]): ReadableStream<T> {
  return new ReadableStream<T>({
    start(controller) {
      for (const item of items) {
        controller.enqueue(item);
      }
      controller.close();
    }
  });
}

/**
 * Creates a writable stream that collects all chunks into an array
 */
export function createCollectorStream<T>(): [WritableStream<T>, Promise<T[]>] {
  const chunks: T[] = [];
  let resolvePromise: (value: T[]) => void;
  
  const resultPromise = new Promise<T[]>(resolve => {
    resolvePromise = resolve;
  });
  
  const writableStream = new WritableStream<T>({
    write(chunk) {
      chunks.push(chunk);
    },
    close() {
      resolvePromise(chunks);
    }
  });
  
  return [writableStream, resultPromise];
}

/**
 * Creates a writerable stream that reports progress
 */
export function createProgressStream<T>(
  total: number,
  onProgress?: (processed: number, total: number, percentage: number) => void
): WritableStream<T> {
  let processed = 0;
  
  return new WritableStream<T>({
    write(chunk) {
      processed++;
      
      if (onProgress) {
        const percentage = Math.min(100, Math.round((processed / total) * 100));
        onProgress(processed, total, percentage);
      }
    }
  });
}

/**
 * Creates a pipeline from a readable stream through transforms and to a writable
 */
export async function createPipeline<T, R = T>(
  readableStream: ReadableStream<T>,
  transforms: TransformStream<any, any>[],
  writableStream?: WritableStream<R>
): Promise<ReadableStream<R>> {
  let stream: ReadableStream<any> = readableStream;
  
  // Apply all transforms
  for (const transform of transforms) {
    stream = stream.pipeThrough(transform);
  }
  
  // If a writable stream is provided, pipe to it
  if (writableStream) {
    const finalStream = stream as ReadableStream<R>;
    finalStream.pipeTo(writableStream).catch(error => {
      console.error("Error in stream pipeline:", error);
    });
  }
  
  return stream as ReadableStream<R>;
}

/**
 * Processes an array of items using the Streams API with progress reporting
 */
export async function processWithStreams<T, R>(
  items: T[], 
  processFn: (item: T) => Promise<R> | R,
  options: {
    onProgress?: (processed: number, total: number, percentage: number) => void;
    onComplete?: (results: R[]) => void;
    onError?: (error: Error, item: T, index: number) => void;
    concurrency?: number;
    signal?: AbortSignal;
  } = {}
): Promise<R[]> {
  if (items.length === 0) return [];
  
  const { 
    onProgress, 
    onComplete, 
    onError,
    concurrency = 4,
    signal
  } = options;
  
  // Check if the AbortSignal is already aborted
  if (signal?.aborted) {
    throw new Error("Processing aborted before it started");
  }
  
  try {
    // Create the readable stream from the array
    const readableStream = createReadableStream(items);
    
    // Create a collector to gather the results
    const [resultStream, resultsPromise] = createCollectorStream<R>();
    
    // Create a transform stream for processing
    const transformStream = createTransformStream<T, R>(
      async (item) => {
        // Check for abort signal
        if (signal?.aborted) {
          throw new Error("Processing aborted");
        }
        
        return await processFn(item);
      },
      {
        handleError: (error, item) => {
          const index = items.indexOf(item);
          if (onError) {
            onError(error, item, index);
          }
        }
      }
    );
    
    // Create a progress reporting stream
    const progressStream = new TransformStream<R, R>({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      }
    });
    
    let processedCount = 0;
    const totalItems = items.length;
    
    // Set up progress tracking
    if (onProgress) {
      // Create a custom transform stream that tracks progress
      const trackProgressTransform = new TransformStream<R, R>({
        transform(chunk, controller) {
          processedCount++;
          const percentage = Math.min(100, Math.round((processedCount / totalItems) * 100));
          
          onProgress(processedCount, totalItems, percentage);
          // Pass the chunk through
          controller.enqueue(chunk);
        }
      });
      
      // Set up the pipeline with our custom transform stream
      await readableStream
        .pipeThrough(transformStream)
        .pipeThrough(trackProgressTransform)
        .pipeTo(resultStream);
    } else {
      // Set up the pipeline without progress tracking
      await readableStream
        .pipeThrough(transformStream)
        .pipeTo(resultStream);
    }
    
    // Wait for all results
    const results = await resultsPromise;
    
    // Call onComplete callback if provided
    if (onComplete) {
      onComplete(results);
    }
    
    return results;
  } catch (error) {
    console.error("Stream processing failed:", error);
    
    if (error instanceof Error && error.message.includes("aborted")) {
      toast.info("Processing was cancelled");
    } else {
      toast.error("Data processing failed");
    }
    
    throw error;
  }
}

/**
 * Creates a batch processor using streams API
 * Splits processing into batches for more efficient memory usage
 */
export async function processInBatches<T, R>(
  items: T[],
  processFn: (batch: T[]) => Promise<R[]>,
  options: {
    batchSize?: number;
    onProgress?: (processed: number, total: number, percentage: number) => void;
    onBatchComplete?: (batchResults: R[], batchIndex: number) => void;
    onComplete?: (allResults: R[]) => void;
    signal?: AbortSignal;
  } = {}
): Promise<R[]> {
  const { 
    batchSize = 50, 
    onProgress, 
    onBatchComplete, 
    onComplete,
    signal
  } = options;
  
  if (items.length === 0) return [];
  
  // Check if already aborted
  if (signal?.aborted) {
    throw new Error("Processing aborted before it started");
  }
  
  try {
    let processed = 0;
    const total = items.length;
    const results: R[] = [];
    
    // Process in batches
    for (let i = 0; i < total; i += batchSize) {
      // Check for abort
      if (signal?.aborted) {
        throw new Error("Processing aborted");
      }
      
      const batch = items.slice(i, Math.min(i + batchSize, total));
      const batchResults = await processFn(batch);
      
      results.push(...batchResults);
      processed += batch.length;
      
      if (onProgress) {
        const percentage = Math.min(100, Math.round((processed / total) * 100));
        onProgress(processed, total, percentage);
      }
      
      if (onBatchComplete) {
        onBatchComplete(batchResults, Math.floor(i / batchSize));
      }
    }
    
    if (onComplete) {
      onComplete(results);
    }
    
    return results;
  } catch (error) {
    console.error("Batch processing failed:", error);
    
    if (error instanceof Error && error.message.includes("aborted")) {
      toast.info("Processing was cancelled");
    } else {
      toast.error("Data processing failed");
    }
    
    throw error;
  }
}

/**
 * Creates a throttled/controlled stream for rate-limited processing
 */
export function createThrottledStream<T>(
  delayMs: number = 100
): TransformStream<T, T> {
  return new TransformStream<T, T>({
    async transform(chunk, controller) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      controller.enqueue(chunk);
    }
  });
}

/**
 * Creates a fork in a stream to process data in multiple ways
 */
export function forkStream<T>(
  readableStream: ReadableStream<T>,
  count: number = 2
): ReadableStream<T>[] {
  return Array.from({ length: count }, () => 
    readableStream.tee()[0]
  );
}

/**
 * A utility to convert between stream types for more flexibility
 */
export function adaptStream<T, R>(
  stream: ReadableStream<T>,
  adapter: (input: ReadableStream<T>) => ReadableStream<R>
): ReadableStream<R> {
  return adapter(stream);
}
