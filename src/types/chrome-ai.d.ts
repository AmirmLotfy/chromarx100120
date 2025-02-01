declare namespace chrome {
  export namespace aiOriginTrial {
    export interface AILanguageModelCapabilities {
      available: 'no' | 'readily' | 'after-download';
      defaultTopK: number;
      maxTopK: number;
      defaultTemperature: number;
    }

    export interface AILanguageModelSession {
      prompt(text: string): Promise<string>;
      promptStreaming(text: string): ReadableStream;
      destroy(): void;
      clone(options?: { signal?: AbortSignal }): Promise<AILanguageModelSession>;
      tokensSoFar: number;
      maxTokens: number;
      tokensLeft: number;
    }

    export interface AILanguageModelOptions {
      systemPrompt?: string;
      temperature?: number;
      topK?: number;
      signal?: AbortSignal;
      monitor?(monitor: EventTarget): void;
      initialPrompts?: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }>;
    }

    export namespace languageModel {
      export function capabilities(): Promise<AILanguageModelCapabilities>;
      export function create(options?: AILanguageModelOptions): Promise<AILanguageModelSession>;
    }
  }
}