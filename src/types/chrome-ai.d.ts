declare namespace chrome {
  interface AIPromptOptions {
    prompt: string;
    maxTokens?: number;
  }

  interface AIPromptResult {
    text: string;
  }

  interface AISummarizerOptions {
    text: string;
    maxSentences?: number;
  }

  interface AISummarizerResult {
    summary: string;
  }

  interface AILanguageDetectionOptions {
    text: string;
  }

  interface AILanguageDetectionResult {
    language: string;
  }

  interface AITranslatorOptions {
    text: string;
    targetLanguage: string;
  }

  interface AITranslatorResult {
    translatedText: string;
  }

  interface AINamespace {
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

  namespace chrome {
    interface Chrome {
      ai?: AINamespace;
    }
  }
}