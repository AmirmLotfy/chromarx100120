declare namespace chrome {
  interface AIGenerateTextOptions {
    model: string;
    prompt: string;
  }

  interface AIGenerateTextResult {
    text: string;
  }

  interface AIGenerateImageOptions {
    model: string;
    prompt: string;
  }

  interface AIGenerateImageResult {
    imageUrl: string;
  }

  interface AIAnalyzeImageOptions {
    model: string;
    imageUrl: string;
    prompt: string;
  }

  interface AIAnalyzeImageResult {
    text: string;
  }

  interface AINamespace {
    generateText(options: AIGenerateTextOptions): Promise<AIGenerateTextResult>;
    generateImage(options: AIGenerateImageOptions): Promise<AIGenerateImageResult>;
    analyzeImage(options: AIAnalyzeImageOptions): Promise<AIAnalyzeImageResult>;
  }

  interface Chrome {
    ai?: AINamespace;
  }
}