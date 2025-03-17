
import { getGeminiResponse } from "./geminiUtils";

export async function streamText(
  text: string,
  controller: AbortController
): Promise<ReadableStream<Uint8Array>> {
  try {
    // Create a text encoder for converting strings to Uint8Array
    const textEncoder = new TextEncoder();
    
    // Create a proper ReadableStream that will yield chunks of text
    return new ReadableStream({
      async start(controller) {
        try {
          // Get the full response
          const response = await getGeminiResponse(text);
          
          // Instead of simulating chunks, we'll properly stream the content
          // by breaking it into natural chunks (sentences or paragraphs)
          const chunks = response.split(/([.!?]\s+)/).filter(Boolean);
          
          for (const chunk of chunks) {
            // Check if the stream was aborted
            if (controller.signal?.aborted) {
              break;
            }
            
            // Encode the chunk and add it to the stream
            controller.enqueue(textEncoder.encode(chunk));
            
            // Add a small delay to simulate real-time streaming
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Properly close the stream when done
          controller.close();
        } catch (error) {
          // Handle errors in the stream
          console.error("Error in stream:", error);
          controller.error(error);
        }
      },
      
      // Implement cancel method to handle aborted streams
      cancel() {
        console.log("Stream was canceled");
      }
    });
  } catch (error) {
    console.error("Error creating text stream:", error);
    throw error;
  }
}

export function arrayBufferToChunk(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer);
}

export async function streamArrayBuffer(
  text: string,
  controller: AbortController
): Promise<ReadableStream<Uint8Array>> {
  try {
    const textEncoder = new TextEncoder();
    
    // Create a proper ReadableStream with TransformStream support
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    
    // Create a writer to write to our stream
    const writer = writable.getWriter();
    
    // Process in background to avoid blocking
    (async () => {
      try {
        // Get the response
        const response = await getGeminiResponse(text);
        
        // Split into natural chunks for more realistic streaming
        const chunks = response.split(/([.!?]\s+)/).filter(Boolean);
        
        for (const chunk of chunks) {
          // Check if the controller is aborted
          if (controller.signal?.aborted) {
            break;
          }
          
          // Write each chunk to the stream
          await writer.write(textEncoder.encode(chunk));
          
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error("Error in array buffer stream:", error);
        // Propagate the error to the stream
        writer.abort(error);
      } finally {
        // Always close the writer when done
        writer.close();
      }
    })();
    
    return readable;
  } catch (error) {
    console.error("Error creating array buffer stream:", error);
    throw error;
  }
}

// Helper method to stream a fetch response
export async function streamFetchResponse(
  url: string,
  options?: RequestInit
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Return the body as a stream directly from fetch
  if (response.body) {
    return response.body;
  }
  
  // Fallback if body isn't available as a stream
  const text = await response.text();
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    }
  });
}

// Utility to pipe a stream through a transform function
export function transformStream<T, R>(
  stream: ReadableStream<T>,
  transform: (chunk: T) => R | Promise<R>
): ReadableStream<R> {
  const transformer = new TransformStream<T, R>({
    async transform(chunk, controller) {
      try {
        const result = await transform(chunk);
        controller.enqueue(result);
      } catch (error) {
        console.error("Error in stream transform:", error);
        controller.error(error);
      }
    }
  });
  
  return stream.pipeThrough(transformer);
}
