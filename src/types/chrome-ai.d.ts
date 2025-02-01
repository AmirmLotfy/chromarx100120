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

    export interface AILanguageDetectorCapabilities {
      available: 'no' | 'readily' | 'after-download';
      languageAvailable(language: string): 'no' | 'readily';
    }

    export interface AILanguageDetectorOptions {
      monitor?(monitor: EventTarget): void;
    }

    export interface AILanguageDetectionResult {
      detectedLanguage: string;
      confidence: number;
    }

    export interface AILanguageDetector {
      detect(text: string): Promise<AILanguageDetectionResult[]>;
      ready: Promise<void>;
      addEventListener(type: 'downloadprogress', listener: (e: { loaded: number; total: number }) => void): void;
    }

    export interface AISummarizerCapabilities {
      available: 'no' | 'readily' | 'after-download';
    }

    export interface AISummarizerOptions {
      sharedContext?: string;
      type?: 'key-points' | 'tl;dr' | 'teaser' | 'headline';
      format?: 'markdown' | 'plain-text';
      length?: 'short' | 'medium' | 'long';
      monitor?(monitor: EventTarget): void;
    }

    export interface AISummarizer {
      summarize(text: string, options?: { context?: string }): Promise<string>;
      summarizeStreaming(text: string, options?: { context?: string }): ReadableStream;
      ready: Promise<void>;
      addEventListener(type: 'downloadprogress', listener: (e: { loaded: number; total: number }) => void): void;
    }

    export namespace languageModel {
      export function capabilities(): Promise<AILanguageModelCapabilities>;
      export function create(options?: AILanguageModelOptions): Promise<AILanguageModelSession>;
    }

    export namespace languageDetector {
      export function capabilities(): Promise<AILanguageDetectorCapabilities>;
      export function create(options?: AILanguageDetectorOptions): Promise<AILanguageDetector>;
    }

    export namespace summarizer {
      export function capabilities(): Promise<AISummarizerCapabilities>;
      export function create(options?: AISummarizerOptions): Promise<AISummarizer>;
    }
  }
}
