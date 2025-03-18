
import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { toast } from 'sonner';

// Configuration options for Gemini API requests
export interface GeminiConfig {
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
}

// Default configuration
const DEFAULT_CONFIG: GeminiConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
};

// The fixed API key for all users
const FIXED_API_KEY = 'AIzaSyDhbGK-nr9qEbGLUPJfYq_Hh-SXtuKfYY8'; // Replace with your actual API key

class GeminiService {
  private isInitialized = false;
  private offlineMode = false;
  private apiClient: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor() {
    this.initialize();
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Set initial offline status
    this.offlineMode = !navigator.onLine;
  }
  
  private handleOnline = () => {
    console.log('App is online, enabling Gemini API');
    this.offlineMode = false;
    
    // Re-initialize the service when coming back online
    this.initialize();
  };
  
  private handleOffline = () => {
    console.log('App is offline, disabling Gemini API');
    this.offlineMode = true;
  };

  private async initialize() {
    try {
      if (this.offlineMode) {
        console.log('Skipping Gemini initialization - device is offline');
        return;
      }
      
      // Initialize with the fixed API key
      this.apiClient = new GoogleGenerativeAI(FIXED_API_KEY);
      this.model = this.apiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
      this.isInitialized = true;
      console.log('Gemini API initialized successfully');
    } catch (error) {
      console.error('Error initializing Gemini service:', error);
      this.isInitialized = false;
    }
  }

  public async getResponse(
    prompt: string, 
    systemPrompt?: string,
    config?: Partial<GeminiConfig>
  ): Promise<string> {
    try {
      if (this.offlineMode) {
        throw new Error('Cannot use AI features while offline');
      }
      
      if (!this.isInitialized || !this.model) {
        await this.initialize();
        
        if (!this.isInitialized || !this.model) {
          throw new Error('Gemini API not initialized.');
        }
      }

      // For system prompt, we need to format it properly
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\nUser: ${prompt}` 
        : prompt;

      const generationConfig: GenerationConfig = {
        temperature: config?.temperature ?? DEFAULT_CONFIG.temperature,
        topK: config?.topK ?? DEFAULT_CONFIG.topK,
        topP: config?.topP ?? DEFAULT_CONFIG.topP,
        maxOutputTokens: config?.maxOutputTokens ?? DEFAULT_CONFIG.maxOutputTokens,
      };

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig,
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error getting Gemini response:', error);
      
      const errorMessage = this.offlineMode
        ? 'AI features are unavailable while offline'
        : 'Failed to get response from Gemini AI.';
      
      toast.error(errorMessage);
      throw error; // Propagate error for retry handling
    }
  }

  public async summarize(content: string, language: string = 'en'): Promise<string> {
    try {
      if (this.offlineMode) {
        throw new Error('Cannot summarize content while offline');
      }
      
      const prompt = `Summarize the following content in ${language} language. Keep the summary concise but informative.
      
      Content to summarize:
      ${content}`;
      
      return await this.getResponse(prompt);
    } catch (error) {
      console.error('Error summarizing content:', error);
      throw error; // Propagate error for retry handling
    }
  }

  public async categorize(content: string, language: string = 'en'): Promise<string> {
    try {
      if (this.offlineMode) {
        throw new Error('Cannot categorize content while offline');
      }
      
      const prompt = `Analyze the following content and suggest a single category that best describes it. Respond with ONLY the category name, nothing else.
      
      Content to categorize:
      ${content}`;
      
      return await this.getResponse(prompt);
    } catch (error) {
      console.error('Error categorizing content:', error);
      throw error; // Propagate error for retry handling
    }
  }

  public async suggestTimer(taskDescription: string, language: string = 'en'): Promise<number> {
    try {
      if (this.offlineMode) {
        throw new Error('Cannot suggest timer duration while offline');
      }
      
      const prompt = `Given this task description: "${taskDescription}", suggest an appropriate time in minutes to complete it. Respond with ONLY a number (e.g., 25), nothing else.`;
      
      const response = await this.getResponse(prompt);
      const minutes = parseInt(response.trim(), 10);
      
      // If parsing fails or the result is not a reasonable number, return a default
      if (isNaN(minutes) || minutes <= 0 || minutes > 180) {
        return 25; // Default to 25 minutes (Pomodoro time)
      }
      
      return minutes;
    } catch (error) {
      console.error('Error suggesting timer duration:', error);
      return 25; // Default to 25 minutes
    }
  }

  public async isAvailable(): Promise<boolean> {
    if (this.offlineMode) {
      return false;
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return this.isInitialized;
  }
  
  public isOffline(): boolean {
    return this.offlineMode;
  }
  
  // Simplified methods that always return true for the API key
  public async hasApiKey(): Promise<boolean> {
    return true;
  }
  
  // No implementation needed - we use a fixed key
  public async setApiKey(): Promise<boolean> {
    return true;
  }
  
  // No implementation needed - we use a fixed key
  public async clearApiKey(): Promise<void> {
    return;
  }
}

export const geminiService = new GeminiService();
