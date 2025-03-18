
import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { storage } from './storage/unifiedStorage';
import { toast } from 'sonner';

export interface GeminiConfig {
  apiKey: string;
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
}

// Default API key that will be used if user doesn't provide their own
// This is a publishable key that can be included in client-side code
const DEFAULT_API_KEY = 'AIzaSyA7WGDYZwPP02EoBPbzq8LAS-iGzRoKZuQ';

const DEFAULT_CONFIG: Omit<GeminiConfig, 'apiKey'> = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
};

class GeminiService {
  private apiKey: string | null = null;
  private model: GenerativeModel | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeApiKey();
  }

  private async initializeApiKey() {
    try {
      // First try to get user's custom API key
      const config = await storage.get('gemini_config');
      if (config && config.apiKey) {
        this.apiKey = config.apiKey;
        this.setupModel(config);
        this.isInitialized = true;
      } else {
        // If no custom key, use the default one
        this.apiKey = DEFAULT_API_KEY;
        this.setupModel({ apiKey: DEFAULT_API_KEY, ...DEFAULT_CONFIG });
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Error initializing Gemini API key:', error);
      // Even if there's an error, still use the default key
      this.apiKey = DEFAULT_API_KEY;
      this.setupModel({ apiKey: DEFAULT_API_KEY, ...DEFAULT_CONFIG });
      this.isInitialized = true;
    }
  }

  private setupModel(config: Partial<GeminiConfig>) {
    try {
      const apiKey = config.apiKey || DEFAULT_API_KEY;
      
      const genAI = new GoogleGenerativeAI(apiKey);
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
        await this.initializeApiKey();
      }

      // If model is still not initialized, initialize with default key
      if (!this.apiKey) {
        this.apiKey = DEFAULT_API_KEY;
        this.setupModel({ apiKey: DEFAULT_API_KEY, ...DEFAULT_CONFIG });
      }

      // If custom config is provided, set up a new model instance
      if (config) {
        const mergedConfig = { 
          ...DEFAULT_CONFIG, 
          apiKey: config.apiKey || this.apiKey || DEFAULT_API_KEY, 
          ...config 
        };
        this.setupModel(mergedConfig);
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

  public async configure(apiKey: string, config?: Partial<Omit<GeminiConfig, 'apiKey'>>): Promise<boolean> {
    try {
      const newConfig: GeminiConfig = {
        apiKey,
        temperature: config?.temperature || DEFAULT_CONFIG.temperature,
        topK: config?.topK || DEFAULT_CONFIG.topK,
        topP: config?.topP || DEFAULT_CONFIG.topP,
        maxOutputTokens: config?.maxOutputTokens || DEFAULT_CONFIG.maxOutputTokens,
      };
      
      await storage.set('gemini_config', newConfig);
      
      this.apiKey = apiKey;
      this.setupModel(newConfig);
      this.isInitialized = true;
      
      return true;
    } catch (error) {
      console.error('Error configuring Gemini API:', error);
      return false;
    }
  }

  // Method to check if a valid API key is available (either user's or default)
  public hasValidApiKey(): boolean {
    return this.isInitialized && !!this.model;
  }
}

export const geminiService = new GeminiService();
