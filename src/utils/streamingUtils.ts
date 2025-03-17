import { getGeminiResponseStream } from "./geminiUtils";

export async function streamText(
  text: string,
  controller: AbortController
): Promise<ReadableStream<Uint8Array>> {
  try {
    const geminiStream = await getGeminiResponseStream(text, controller);
    return geminiStream;
  } catch (error) {
    console.error("Error streaming text:", error);
    throw error;
  }
}

function arrayBufferToChunk<T extends ArrayBufferView>(buffer: ArrayBuffer): T {
  // Implementation with proper type casting
  return new Uint8Array(buffer) as unknown as T;
}

export async function streamArrayBuffer(
  text: string,
  controller: AbortController
): Promise<ReadableStream<Uint8Array>> {
  try {
    const geminiStream = await getGeminiResponseStream(text, controller);

    const transformStream = new TransformStream<Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
    });

    const reader = geminiStream.getReader();
    const writer = transformStream.writable.getWriter();

    const pump = async () => {
      try {
        const { done, value } = await reader.read();
        if (done) {
          writer.close();
          return;
        }
        await writer.write(value);
        pump();
      } catch (e) {
        console.error("Error in pump", e);
        writer.abort(e);
      }
    };

    pump();

    return transformStream.readable;
  } catch (error) {
    console.error("Error streaming array buffer:", error);
    throw error;
  }
}
