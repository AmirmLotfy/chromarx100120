
import { toast } from "sonner";

// Generic type for data processor function
export type DataProcessorFn<T, R> = (data: T, index: number) => Promise<R> | R;

// Options for data stream processing
export interface DataStreamOptions<T, R = T> {
  batchSize?: number;
  pauseBetweenBatches?: number;
  onProgress?: (progress: number) => void;
  onBatchComplete?: (processedItems: number, totalItems: number, batch: T[]) => void;
  onComplete?: (result: R[]) => void;
  onError?: (error: Error, item: T, index: number) => void;
  abortSignal?: AbortSignal;
  preserveOrder?: boolean;
  maxConcurrent?: number;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Creates a stream processor for handling data in batches with progress tracking
 * @template T Input data type
 * @template R Output data type (defaults to T if transformation isn't needed)
 */
export class DataStreamProcessor<T, R = T> {
  private abortController: AbortController;
  
  constructor() {
    this.abortController = new AbortController();
  }
  
  /**
   * Process an array of data items with batching and progress tracking
   */
  async process(
    items: T[],
    processFn: DataProcessorFn<T, R>,
    options: DataStreamOptions<T, R> = {}
  ): Promise<R[]> {
    const {
      batchSize = 10,
      pauseBetweenBatches = 0,
      onProgress,
      onBatchComplete,
      onComplete,
      onError,
      abortSignal,
      preserveOrder = true,
      maxConcurrent = 5,
      retryCount = 0,
      retryDelay = 1000,
      timeout = 30000
    } = options;
    
    // Link external abort signal if provided
    if (abortSignal) {
      if (abortSignal.aborted) {
        throw new Error("Processing aborted before it started");
      }
      
      abortSignal.addEventListener("abort", () => {
        this.abortController.abort();
      });
    }
    
    // Our internal abort signal
    const signal = this.abortController.signal;
    
    if (items.length === 0) {
      return [] as R[];
    }
    
    try {
      const results: R[] = [];
      const totalItems = items.length;
      let processedCount = 0;
      
      // Process in batches
      for (let i = 0; i < items.length; i += batchSize) {
        // Check if processing was aborted
        if (signal.aborted) {
          throw new Error("Processing was aborted");
        }
        
        const batch = items.slice(i, Math.min(i + batchSize, items.length));
        const batchResults: (R | Error)[] = new Array(batch.length);
        
        // Process the batch with concurrency limits
        if (preserveOrder) {
          // Process in order (sequential within batch, batches in parallel)
          const batchPromises = batch.map(async (item, batchIndex) => {
            const index = i + batchIndex;
            
            try {
              if (signal.aborted) return;
              
              // Apply timeout if specified
              const result = await this.processWithTimeout(
                () => processFn(item, index),
                timeout,
                retryCount,
                retryDelay,
                signal
              );
              
              batchResults[batchIndex] = result;
            } catch (error) {
              console.error(`Error processing item at index ${index}:`, error);
              batchResults[batchIndex] = error as Error;
              
              if (!signal.aborted && onError) {
                onError(error as Error, item, index);
              }
            }
          });
          
          await Promise.all(batchPromises);
          
          // Filter out errors and add successful results
          batchResults.forEach((result, idx) => {
            if (!(result instanceof Error)) {
              results.push(result);
            }
          });
        } else {
          // Process with maximum concurrency
          const queue = [...batch];
          const processing = new Set();
          
          while (queue.length > 0 || processing.size > 0) {
            // Fill the processing set up to maxConcurrent
            while (queue.length > 0 && processing.size < maxConcurrent) {
              const item = queue.shift();
              const index = i + batch.indexOf(item);
              
              if (signal.aborted) break;
              
              const promise = (async () => {
                try {
                  const result = await this.processWithTimeout(
                    () => processFn(item as T, index),
                    timeout,
                    retryCount,
                    retryDelay,
                    signal
                  );
                  results.push(result);
                  processedCount++;
                  
                  return { success: true, index };
                } catch (error) {
                  console.error(`Error processing item at index ${index}:`, error);
                  
                  if (!signal.aborted && onError) {
                    onError(error as Error, item as T, index);
                  }
                  
                  return { success: false, index, error };
                } finally {
                  processing.delete(promise);
                }
              })();
              
              processing.add(promise);
            }
            
            if (processing.size > 0) {
              // Wait for at least one task to complete
              await Promise.race([...processing]);
            }
          }
        }
        
        // Update processed count
        processedCount = preserveOrder ? Math.min(i + batchSize, items.length) : processedCount;
        
        // Report progress
        if (onProgress) {
          const progress = Math.round((processedCount / totalItems) * 100);
          onProgress(progress);
        }
        
        // Batch complete callback
        if (onBatchComplete) {
          onBatchComplete(processedCount, totalItems, batch);
        }
        
        // Pause between batches if requested
        if (pauseBetweenBatches > 0 && i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, pauseBetweenBatches));
        }
      }
      
      // Call complete callback
      if (!signal.aborted && onComplete) {
        onComplete(results);
      }
      
      return results;
    } catch (error) {
      console.error("Data stream processing failed:", error);
      
      if (error instanceof Error && error.name === "AbortError") {
        toast.info("Processing was cancelled");
      } else {
        toast.error("Data processing failed");
      }
      
      throw error;
    }
  }
  
  /**
   * Process a single item with timeout and retry logic
   */
  private async processWithTimeout<R>(
    fn: () => Promise<R> | R,
    timeout: number,
    retryCount: number,
    retryDelay: number,
    signal: AbortSignal
  ): Promise<R> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        // Check for abort signal
        if (signal.aborted) {
          throw new Error("Processing aborted");
        }
        
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          const id = setTimeout(() => {
            clearTimeout(id);
            reject(new Error(`Processing timed out after ${timeout}ms`));
          }, timeout);
        });
        
        // Race between the actual processing and the timeout
        return await Promise.race([
          Promise.resolve().then(() => fn()),
          timeoutPromise
        ]);
      } catch (error) {
        lastError = error as Error;
        
        // If we're out of retries or aborted, throw the error
        if (attempt >= retryCount || signal.aborted) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // This should never happen, but TypeScript doesn't know that
    throw lastError || new Error("Unknown error in processing");
  }
  
  /**
   * Cancel the current processing
   */
  cancel(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
  }
  
  /**
   * Check if processing is currently aborted
   */
  isAborted(): boolean {
    return this.abortController.signal.aborted;
  }
}

/**
 * Create a transform stream that processes data through a pipeline function
 */
export function createTransformStream<T, R>(
  transformFn: (chunk: T) => Promise<R> | R,
  options: {
    handleError?: (error: Error, chunk: T) => void;
    flushFinal?: () => Promise<void> | void;
  } = {}
): TransformStream<T, R> {
  return new TransformStream<T, R>({
    async transform(chunk, controller) {
      try {
        const result = await transformFn(chunk);
        controller.enqueue(result);
      } catch (error) {
        console.error("Error in transform stream:", error);
        
        if (options.handleError) {
          options.handleError(error as Error, chunk);
        } else {
          controller.error(error);
        }
      }
    },
    
    flush(controller) {
      if (options.flushFinal) {
        Promise.resolve(options.flushFinal()).catch(error => {
          console.error("Error in transform stream flush:", error);
          controller.error(error);
        });
      }
    }
  });
}

/**
 * Create a custom stream pipeline that connects multiple transform steps
 */
export function createStreamPipeline<T, R>(
  steps: Array<(stream: ReadableStream<any>) => ReadableStream<any>>,
  initialData?: T[]
): {
  stream: ReadableStream<any>;
  controller: ReadableStreamDefaultController<T>;
  write: (chunk: T) => void;
  end: () => void;
} {
  let controller: ReadableStreamDefaultController<T>;
  
  // Create source stream
  const sourceStream = new ReadableStream<T>({
    start(c) {
      controller = c;
      
      // If initial data is provided, write it to the stream
      if (initialData) {
        for (const item of initialData) {
          controller.enqueue(item);
        }
      }
    }
  });
  
  // Apply all transform steps
  let currentStream = sourceStream;
  for (const step of steps) {
    currentStream = step(currentStream);
  }
  
  // Helper to write data to the stream
  const write = (chunk: T) => {
    controller.enqueue(chunk);
  };
  
  // Helper to close the stream
  const end = () => {
    controller.close();
  };
  
  return {
    stream: currentStream,
    controller,
    write,
    end
  };
}

/**
 * Split a stream into multiple branches that can be processed independently
 */
export function teeStream<T>(
  stream: ReadableStream<T>,
  count: number = 2
): ReadableStream<T>[] {
  if (count <= 0) {
    throw new Error("Stream branch count must be positive");
  }
  
  if (count === 1) {
    return [stream];
  }
  
  let streams: ReadableStream<T>[] = [stream];
  
  // Tee the stream count-1 times
  for (let i = 1; i < count; i++) {
    const [s1, s2] = streams[0].tee();
    streams[0] = s1;
    streams.push(s2);
  }
  
  return streams;
}

/**
 * Helper function for text chunking (useful for large text processing)
 */
export function chunkText(text: string, chunkSize: number = 1024): string[] {
  const chunks: string[] = [];
  
  // Try to chunk at natural boundaries like paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = "";
  
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length <= chunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    } else {
      // If paragraph is larger than chunk size, split it
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      
      if (paragraph.length <= chunkSize) {
        currentChunk = paragraph;
      } else {
        // Split large paragraph into sentences
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length <= chunkSize) {
            currentChunk += (currentChunk ? " " : "") + sentence;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk);
            }
            
            // Handle sentences longer than chunk size
            if (sentence.length <= chunkSize) {
              currentChunk = sentence;
            } else {
              // Have to split by words
              let remaining = sentence;
              while (remaining.length > 0) {
                chunks.push(remaining.substring(0, chunkSize));
                remaining = remaining.substring(chunkSize);
              }
              currentChunk = "";
            }
          }
        }
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Example: Create a data processing hook that utilizes our stream utilities
 */
export function useDataProcessing<T, R>() {
  const processor = new DataStreamProcessor<T, R>();
  
  return {
    processItems: (items: T[], processFn: DataProcessorFn<T, R>, options?: DataStreamOptions<T, R>) => {
      return processor.process(items, processFn, options);
    },
    
    cancel: () => processor.cancel(),
    
    isProcessing: () => !processor.isAborted(),
    
    createPipeline: (steps: Array<(stream: ReadableStream<any>) => ReadableStream<any>>) => {
      return createStreamPipeline<T, any>(steps);
    }
  };
}
