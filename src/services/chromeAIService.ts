import { toast } from "sonner";

export class ChromeAIService {
  private static instance: ChromeAIService;
  private isExtensionEnvironment: boolean;

  private constructor() {
    this.isExtensionEnvironment = typeof chrome !== 'undefined' && 
      'ai' in chrome && 
      chrome.ai !== null;
  }

  public static getInstance(): ChromeAIService {
    if (!ChromeAIService.instance) {
      ChromeAIService.instance = new ChromeAIService();
    }
    return ChromeAIService.instance;
  }

  public async generatePrompt(input: string): Promise<string> {
    if (!this.isExtensionEnvironment) {
      console.warn('Chrome AI APIs are not available in this environment');
      return input;
    }

    try {
      const result = await (chrome as any).ai.prompt.generate({
        prompt: input,
        maxTokens: 100
      });
      return result.text;
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast.error('Failed to generate prompt');
      return input;
    }
  }

  public async summarizeText(text: string): Promise<string> {
    if (!this.isExtensionEnvironment) {
      console.warn('Chrome AI APIs are not available in this environment');
      return text;
    }

    try {
      const result = await (chrome as any).ai.summarizer.summarize({
        text,
        maxSentences: 3
      });
      return result.summary;
    } catch (error) {
      console.error('Error summarizing text:', error);
      toast.error('Failed to summarize text');
      return text;
    }
  }

  public async detectLanguage(text: string): Promise<string> {
    if (!this.isExtensionEnvironment) {
      console.warn('Chrome AI APIs are not available in this environment');
      return 'en';
    }

    try {
      const result = await (chrome as any).ai.language.detectLanguage({
        text
      });
      return result.language;
    } catch (error) {
      console.error('Error detecting language:', error);
      toast.error('Failed to detect language');
      return 'en';
    }
  }

  public async translateText(text: string, targetLanguage: string): Promise<string> {
    if (!this.isExtensionEnvironment) {
      console.warn('Chrome AI APIs are not available in this environment');
      return text;
    }

    try {
      const result = await (chrome as any).ai.translator.translate({
        text,
        targetLanguage
      });
      return result.translatedText;
    } catch (error) {
      console.error('Error translating text:', error);
      toast.error('Failed to translate text');
      return text;
    }
  }
}

export const chromeAI = ChromeAIService.getInstance();