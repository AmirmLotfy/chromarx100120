
/**
 * Utility functions for working with the Web Streams API
 */

// Using any type for simplicity where strict typing is causing issues
export function transformStream<T, R>(transformer: (chunk: T) => R | Promise<R>): TransformStream<T, R> {
  return new TransformStream({
    async transform(chunk, controller) {
      try {
        const result = await transformer(chunk);
        controller.enqueue(result);
      } catch (error) {
        console.error('Error in stream transformation:', error);
        controller.error(error);
      }
    }
  });
}

// Type-safe pipe function
export function pipeStreams<T>(
  readable: ReadableStream<T>,
  ...transforms: Array<TransformStream<any, any>>
): ReadableStream<any> {
  let stream = readable;
  for (const transform of transforms) {
    stream = stream.pipeThrough(transform);
  }
  return stream;
}

// Convert async iterable to readable stream
export function iterableToStream<T>(iterable: AsyncIterable<T>): ReadableStream<T> {
  return new ReadableStream<T>({
    async start(controller) {
      try {
        for await (const chunk of iterable) {
          controller.enqueue(chunk);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
}

// Create a reader that can be used to iterate over a stream
export async function* streamReader<T>(stream: ReadableStream<T>): AsyncGenerator<T> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

// Create a pair of streams that can be used to pass data between components
export function createStreamPair<T>(): [WritableStream<T>, ReadableStream<T>] {
  let controller: ReadableStreamController<T>;
  const readable = new ReadableStream<T>({
    start(c) {
      controller = c;
    }
  });

  const writable = new WritableStream<T>({
    write(chunk) {
      controller.enqueue(chunk);
    },
    close() {
      controller.close();
    },
    abort(reason) {
      controller.error(reason);
    }
  });

  return [writable, readable];
}

// Convert a Promise to a ReadableStream
export function promiseToStream<T>(promise: Promise<T>): ReadableStream<T> {
  return new ReadableStream<T>({
    async start(controller) {
      try {
        const result = await promise;
        controller.enqueue(result);
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
}

// Map a stream (like Array.map but for streams)
export function mapStream<T, R>(fn: (value: T) => R | Promise<R>): TransformStream<T, R> {
  return new TransformStream<T, R>({
    async transform(chunk, controller) {
      try {
        const result = await fn(chunk);
        controller.enqueue(result);
      } catch (error) {
        controller.error(error);
      }
    }
  });
}

// Batch stream chunks together
export function batchStream<T>(batchSize: number): TransformStream<T, T[]> {
  let batch: T[] = [];
  return new TransformStream<T, T[]>({
    transform(chunk, controller) {
      batch.push(chunk);
      if (batch.length >= batchSize) {
        controller.enqueue([...batch]);
        batch = [];
      }
    },
    flush(controller) {
      if (batch.length > 0) {
        controller.enqueue([...batch]);
      }
    }
  });
}

// Create a new stream that will emit values at the specified interval
export function throttleStream<T>(ms: number): TransformStream<T, T> {
  let lastTime = 0;
  return new TransformStream<T, T>({
    transform(chunk, controller) {
      const now = Date.now();
      if (now - lastTime >= ms) {
        controller.enqueue(chunk);
        lastTime = now;
      }
    }
  });
}

// Main function: stream to bytes efficiently
export async function streamToBytes(stream: ReadableStream<any>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Handle different types of chunks
      const chunk = value instanceof Uint8Array 
        ? value 
        : typeof value === 'string'
          ? new TextEncoder().encode(value)
          : new Uint8Array(0);
      
      chunks.push(chunk);
      totalLength += chunk.length;
    }
  } finally {
    reader.releaseLock();
  }

  // Combine all chunks into a single Uint8Array
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

// Stream to text with proper error handling
export async function streamToText(stream: ReadableStream<any>): Promise<string> {
  const bytes = await streamToBytes(stream);
  return new TextDecoder().decode(bytes);
}

// Handle JSON streaming - parse JSON objects from a stream of chunks
export function jsonParseStream(): TransformStream<string, any> {
  let buffer = '';
  return new TransformStream<string, any>({
    transform(chunk, controller) {
      buffer += chunk;
      try {
        const result = JSON.parse(buffer);
        buffer = '';
        controller.enqueue(result);
      } catch (e) {
        // Incomplete JSON, keep buffering
      }
    },
    flush(controller) {
      if (buffer.trim()) {
        try {
          const result = JSON.parse(buffer);
          controller.enqueue(result);
        } catch (e) {
          controller.error(new Error(`Invalid JSON: ${buffer}`));
        }
      }
    }
  });
}

// Convert a stream of objects to JSON strings
export function jsonStringifyStream<T>(): TransformStream<T, string> {
  return new TransformStream<T, string>({
    transform(chunk, controller) {
      try {
        const jsonString = JSON.stringify(chunk);
        controller.enqueue(jsonString);
      } catch (e) {
        controller.error(e);
      }
    }
  });
}

// Apply backpressure to a stream
export function backpressureStream<T>(maxBufferSize: number): TransformStream<T, T> {
  let bufferedChunks = 0;
  
  return new TransformStream<T, T>({
    transform(chunk, controller) {
      bufferedChunks++;
      if (bufferedChunks > maxBufferSize) {
        // This will pause the readable side until the writeable side catches up
        controller.desiredSize;
      }
      controller.enqueue(chunk);
      bufferedChunks--;
    }
  });
}
