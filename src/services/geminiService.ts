
import { storage } from './storage/unifiedStorage';
import { toast } from 'sonner';
import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

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

// Storage key for the API key
const API_KEY_STORAGE_KEY = 'gemini_api_key';

// Default API key provided for all users
const DEFAULT_API_KEY = 'AIzaSyCJCo0vVKkx7q2rsdGG1Pu0BmdXYl9sYhE';

class GeminiService {
  private isInitialized = false;
  private offlineMode = false;
  private apiClient: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private apiKey: string | null = null;

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
      
      // First try to get a user-provided API key from storage
      this.apiKey = await storage.get(API_KEY_STORAGE_KEY) as string | null;
      
      // If no user key is found, use the default key
      if (!this.apiKey) {
        console.log('Using default Gemini API key');
        this.apiKey = DEFAULT_API_KEY;
      }
      
      // Initialize the Google Generative AI client
      this.apiClient = new GoogleGenerativeAI(this.apiKey);
      this.model = this.apiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
      this.isInitialized = true;
      
      console.log('Gemini API initialized successfully');
    } catch (error) {
      console.error('Error initializing Gemini service:', error);
      this.isInitialized = false;
    }
  }

  public async setApiKey(apiKey: string): Promise<boolean> {
    try {
      // Validate API key by making a test request
      const tempClient = new GoogleGenerativeAI(apiKey);
      const tempModel = tempClient.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Test with a simple prompt
      const result = await tempModel.generateContent("Hello, please respond with 'Working' if you can process this message.");
      const response = await result.response;
      const text = response.text();
      
      if (text && text.includes('Working')) {
        // API key works, save it
        await storage.set(API_KEY_STORAGE_KEY, apiKey);
        this.apiKey = apiKey;
        this.apiClient = tempClient;
        this.model = tempModel;
        this.isInitialized = true;
        toast.success('Gemini API key verified and saved');
        return true;
      } else {
        toast.error('Invalid API key or API not responding correctly');
        return false;
      }
    } catch (error) {
      console.error('Error validating Gemini API key:', error);
      toast.error('Failed to validate API key. Please check the key and try again.');
      return false;
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
        : 'Failed to get response from Gemini AI';
      
      toast.error(errorMessage);
      throw error; // Propagate error for retry handling
    }
  }

  // Specialized methods for different AI operations
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

  // Method to check if service is available
  public async isAvailable(): Promise<boolean> {
    if (this.offlineMode) {
      return false;
    }
    
    // Since we have a default key, we focus on whether the service is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return this.isInitialized;
  }
  
  // Public method to get offline status
  public isOffline(): boolean {
    return this.offlineMode;
  }
  
  // Method to check if a custom API key is set by the user
  public async hasApiKey(): Promise<boolean> {
    const apiKey = await storage.get(API_KEY_STORAGE_KEY) as string | null;
    return !!apiKey;
  }
  
  // Method to clear custom API key and revert to default
  public async clearApiKey(): Promise<void> {
    await storage.remove(API_KEY_STORAGE_KEY);
    
    // Reinitialize with default key
    this.apiKey = DEFAULT_API_KEY;
    this.apiClient = new GoogleGenerativeAI(DEFAULT_API_KEY);
    this.model = this.apiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
    this.isInitialized = true;
    
    console.log('Reverted to default Gemini API key');
  }
}

export const geminiService = new GeminiService();
