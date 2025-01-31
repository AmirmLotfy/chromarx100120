declare namespace chrome {
  export interface AIPromptOptions {
    prompt: string;
    maxTokens?: number;
  }

  export interface AIPromptResult {
    text: string;
  }

  export interface AISummarizerOptions {
    text: string;
    maxSentences?: number;
  }

  export interface AISummarizerResult {
    summary: string;
  }

  export interface AILanguageDetectionOptions {
    text: string;
  }

  export interface AILanguageDetectionResult {
    language: string;
  }

  export interface AITranslatorOptions {
    text: string;
    targetLanguage: string;
  }

  export interface AITranslatorResult {
    translatedText: string;
  }

  export interface AINamespace {
    prompt: {
      generate(options: AIPromptOptions): Promise<AIPromptResult>;
    };
    summarizer: {
      summarize(options: AISummarizerOptions): Promise<AISummarizerResult>;
    };
    language: {
      detectLanguage(options: AILanguageDetectionOptions): Promise<AILanguageDetectionResult>;
    };
    translator: {
      translate(options: AITranslatorOptions): Promise<AITranslatorResult>;
    };
  }

  export interface Chrome {
    ai?: AINamespace;
  }
}