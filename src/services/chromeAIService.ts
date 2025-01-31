class ChromeAIService {
  private static instance: ChromeAIService;
  private isExtensionEnvironment: boolean;

  private constructor() {
    // Check if we're in a Chrome extension environment and if AI is available
    this.isExtensionEnvironment = typeof chrome !== 'undefined' && 
      chrome.runtime?.id !== undefined &&
      'ai' in chrome;
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
      // Use type assertion to handle the AI property
      const chromeWithAI = chrome as unknown as { ai: { generateText: (options: { model: string; prompt: string }) => Promise<{ text: string }> } };
      
      const response = await chromeWithAI.ai.generateText({
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
      // Use type assertion to handle the AI property
      const chromeWithAI = chrome as unknown as { ai: { generateImage: (options: { model: string; prompt: string }) => Promise<{ imageUrl: string }> } };
      
      const response = await chromeWithAI.ai.generateImage({
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
      // Use type assertion to handle the AI property
      const chromeWithAI = chrome as unknown as { ai: { analyzeImage: (options: { model: string; imageUrl: string; prompt: string }) => Promise<{ text: string }> } };
      
      const response = await chromeWithAI.ai.analyzeImage({
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