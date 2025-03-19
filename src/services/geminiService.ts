
import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { toast } from 'sonner';
import { fetchWithCors } from '@/utils/corsUtils';

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

// Edge function URL (for proxy API access)
const AI_FEATURES_URL = import.meta.env.VITE_SUPABASE_URL 
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-features`
  : 'https://your-project-id.supabase.co/functions/v1/ai-features'; // Fallback URL

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
      
      // Check if the edge function is reachable
      const response = await fetch(AI_FEATURES_URL, {
        method: 'OPTIONS',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log('AI edge function is available');
        this.isInitialized = true;
      } else {
        // Fallback to direct API access for development or testing
        console.log('AI edge function not available, initializing direct client');
        this.apiClient = new GoogleGenerativeAI('not-used'); // Dummy key - won't be used
        this.model = this.apiClient.getGenerativeModel({ model: "gemini-1.5-pro" });
        this.isInitialized = true;
      }
      
      console.log('Gemini service initialized successfully');
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
      
      if (!this.isInitialized) {
        await this.initialize();
        
        if (!this.isInitialized) {
          throw new Error('Gemini API not initialized.');
        }
      }

      // For system prompt, we need to format it properly
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\nUser: ${prompt}` 
        : prompt;

      try {
        // Use Edge Function as a proxy
        const response = await fetchWithCors(AI_FEATURES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'chat',
            content: fullPrompt,
          }),
        });

        if (!response.ok) {
          throw new Error(`Error from proxy: ${response.status}`);
        }

        const data = await response.json();
        return data.result;
      } catch (error) {
        console.error('Error using AI proxy:', error);
        throw error;
      }
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
      
      try {
        // Use Edge Function as a proxy
        const response = await fetchWithCors(AI_FEATURES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'summarize',
            content,
            language
          }),
        });

        if (!response.ok) {
          throw new Error(`Error from proxy: ${response.status}`);
        }

        const data = await response.json();
        return data.result;
      } catch (error) {
        console.error('Error using AI proxy for summarization:', error);
        throw error;
      }
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
      
      // Extract title and URL if provided in the content
      const titleMatch = content.match(/Title:\s*(.*?)(\n|$)/);
      const urlMatch = content.match(/URL:\s*(.*?)(\n|$)/);
      
      const title = titleMatch ? titleMatch[1] : '';
      const url = urlMatch ? urlMatch[1] : '';
      
      try {
        // Use Edge Function as a proxy
        const response = await fetchWithCors(AI_FEATURES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'categorize',
            content,
            title,
            url,
            language
          }),
        });

        if (!response.ok) {
          throw new Error(`Error from proxy: ${response.status}`);
        }

        const data = await response.json();
        return data.result;
      } catch (error) {
        console.error('Error using AI proxy for categorization:', error);
        throw error;
      }
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
      
      try {
        // Use Edge Function as a proxy
        const response = await fetchWithCors(AI_FEATURES_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'suggest-timer',
            content: taskDescription,
            language
          }),
        });

        if (!response.ok) {
          throw new Error(`Error from proxy: ${response.status}`);
        }

        const data = await response.json();
        const minutes = parseInt(data.result, 10);
        
        // If parsing fails or the result is not a reasonable number, return a default
        if (isNaN(minutes) || minutes <= 0 || minutes > 180) {
          return 25; // Default to 25 minutes (Pomodoro time)
        }
        
        return minutes;
      } catch (error) {
        console.error('Error using AI proxy for timer suggestion:', error);
        return 25; // Default to 25 minutes
      }
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
    
    try {
      // Try a simple request to the proxy to see if it's available
      const response = await fetch(AI_FEATURES_URL, {
        method: 'OPTIONS'
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
  
  public isOffline(): boolean {
    return this.offlineMode;
  }
  
  // Simplified methods that always return true for the API key
  public async hasApiKey(): Promise<boolean> {
    return true;
  }
  
  // No implementation needed - we use a proxy service
  public async setApiKey(): Promise<boolean> {
    return true;
  }
  
  // No implementation needed - we use a proxy service
  public async clearApiKey(): Promise<void> {
    return;
  }
}

export const geminiService = new GeminiService();
