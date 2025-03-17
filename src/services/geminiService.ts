
import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { chromeStorage } from './chromeStorageService';
import { toast } from 'sonner';

export interface GeminiConfig {
  apiKey: string;
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
}

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
      const config = await chromeStorage.get<GeminiConfig>('gemini_config');
      if (config && config.apiKey) {
        this.apiKey = config.apiKey;
        this.setupModel(config);
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Error initializing Gemini API key:', error);
    }
  }

  private setupModel(config: Partial<GeminiConfig>) {
    try {
      if (!config.apiKey) return;
      
      const genAI = new GoogleGenerativeAI(config.apiKey);
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

      if (!this.apiKey) {
        toast.error('Gemini API key is not configured. Please set it in the settings.');
        return 'API key not configured. Please set up your API key in settings.';
      }

      // If custom config is provided, set up a new model instance
      if (config) {
        const mergedConfig = { ...DEFAULT_CONFIG, apiKey: this.apiKey, ...config };
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
      
      await chromeStorage.set('gemini_config', newConfig);
      
      this.apiKey = apiKey;
      this.setupModel(newConfig);
      this.isInitialized = true;
      
      return true;
    } catch (error) {
      console.error('Error configuring Gemini API:', error);
      return false;
    }
  }
}

export const geminiService = new GeminiService();
