import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiService {
  private static instance: GeminiService;
  private genAI: GoogleGenerativeAI | null = null;

  private constructor() {}

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  async initialize(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async summarizeContent(content: string, language: string = 'en'): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Summarize this content concisely in ${language} language: ${content}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error summarizing content:', error);
      throw error;
    }
  }

  async suggestCategory(title: string, url: string, language: string = 'en'): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Suggest a single category for this bookmark in ${language}:\nTitle: ${title}\nURL: ${url}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error suggesting category:', error);
      throw error;
    }
  }
}

export const geminiService = GeminiService.getInstance();