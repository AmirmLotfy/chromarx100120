class ChromeAIService {
  private static instance: ChromeAIService;
  private isExtensionEnvironment: boolean;

  private constructor() {
    this.isExtensionEnvironment = typeof chrome !== 'undefined' && 
      'ai' in chrome && 
      chrome.ai !== null;
  }

  static getInstance(): ChromeAIService {
    if (!ChromeAIService.instance) {
      ChromeAIService.instance = new ChromeAIService();
    }
    return ChromeAIService.instance;
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.isExtensionEnvironment) {
      throw new Error('Chrome AI is only available in the Chrome extension environment');
    }

    try {
      const response = await chrome.ai.generateText({
        model: 'gemini-pro',
        prompt: prompt
      });

      if (!response || !response.text) {
        throw new Error('No response from AI service');
      }

      return response.text;
    } catch (error) {
      console.error('Error generating text:', error);
      throw error;
    }
  }

  async generateImage(prompt: string): Promise<string> {
    if (!this.isExtensionEnvironment) {
      throw new Error('Chrome AI is only available in the Chrome extension environment');
    }

    try {
      const response = await chrome.ai.generateImage({
        model: 'gemini-pro-vision',
        prompt: prompt
      });

      if (!response || !response.imageUrl) {
        throw new Error('No image generated from AI service');
      }

      return response.imageUrl;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }

  async analyzeImage(imageUrl: string, prompt: string): Promise<string> {
    if (!this.isExtensionEnvironment) {
      throw new Error('Chrome AI is only available in the Chrome extension environment');
    }

    try {
      const response = await chrome.ai.analyzeImage({
        model: 'gemini-pro-vision',
        imageUrl: imageUrl,
        prompt: prompt
      });

      if (!response || !response.text) {
        throw new Error('No analysis from AI service');
      }

      return response.text;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }
}

export const chromeAIService = ChromeAIService.getInstance();