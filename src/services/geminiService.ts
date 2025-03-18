
import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { storage } from './storage/unifiedStorage';
import { toast } from 'sonner';

export interface GeminiConfig {
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
}

// Default API key that will be used for all users
// This is a publishable key that can be included in client-side code
const API_KEY = 'AIzaSyA7WGDYZwPP02EoBPbzq8LAS-iGzRoKZuQ';

const DEFAULT_CONFIG: GeminiConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
};

class GeminiService {
  private model: GenerativeModel | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.setupModel(DEFAULT_CONFIG);
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing Gemini model:', error);
    }
  }

  private setupModel(config: Partial<GeminiConfig>) {
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      this.model = genAI.getGenerativeModel({ 
        model: "gemini-pro",
        generationConfig: {
          temperature: config.temperature || DEFAULT_CONFIG.temperature,
          topK: config.topK || DEFAULT_CONFIG.topK,
          topP: config.topP || DEFAULT_CONFIG.topP,
          maxOutputTokens: config.maxOutputTokens || DEFAULT_CONFIG.maxOutputTokens,
        }
      });
    } catch (error) {
      console.error('Error setting up Gemini model:', error);
    }
  }

  public async getResponse(
    prompt: string, 
    systemPrompt?: string,
    config?: Partial<GeminiConfig>
  ): Promise<string> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // If model is still not initialized, initialize with default config
      if (!this.model) {
        this.setupModel(DEFAULT_CONFIG);
      }

      // If custom config is provided, set up a new model instance
      if (config) {
        this.setupModel(config);
      }

      if (!this.model) {
        throw new Error('Gemini model is not initialized');
      }

      // For system prompt, we need to format it properly
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\nUser: ${prompt}` 
        : prompt;

      const result = await this.model.generateContent(fullPrompt);
      const text = result.response.text();

      return text;
    } catch (error) {
      console.error('Error getting Gemini response:', error);
      toast.error('Failed to get response from Gemini AI');
      return 'Sorry, I encountered an error processing your request.';
    }
  }

  // Method to check if model is available
  public hasValidModel(): boolean {
    return this.isInitialized && !!this.model;
  }
}

export const geminiService = new GeminiService();
