
import { getGeminiResponse } from "./geminiUtils";

export async function streamText(
  text: string,
  controller: AbortController
): Promise<ReadableStream<Uint8Array>> {
  try {
    // Create a simple text encoder stream since getGeminiResponseStream doesn't exist
    const textEncoder = new TextEncoder();
    const response = await getGeminiResponse(text);
    
    // Create a readable stream that delivers the text in chunks
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        // Simulate streaming by breaking the response into chunks
        const chunkSize = 20;
        for (let i = 0; i < response.length; i += chunkSize) {
          const chunk = response.substring(i, i + chunkSize);
          controller.enqueue(textEncoder.encode(chunk));
        }
        controller.close();
      }
    });
    
    return stream;
  } catch (error) {
    console.error("Error streaming text:", error);
    throw error;
  }
}

function arrayBufferToChunk(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer);
}

export async function streamArrayBuffer(
  text: string,
  controller: AbortController
): Promise<ReadableStream<Uint8Array>> {
  try {
    // Create a stream from the text response
    const textEncoder = new TextEncoder();
    const response = await getGeminiResponse(text);
    
    // Create a transform stream to process the data
    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
    });

    // Manually push chunks into the stream
    const writer = transformStream.writable.getWriter();
    
    // Simulate streaming by breaking the response into chunks
    const chunkSize = 20;
    for (let i = 0; i < response.length; i += chunkSize) {
      const chunk = response.substring(i, i + chunkSize);
      await writer.write(textEncoder.encode(chunk));
    }
    writer.close();

    return transformStream.readable;
  } catch (error) {
    console.error("Error streaming array buffer:", error);
    throw error;
  }
}
