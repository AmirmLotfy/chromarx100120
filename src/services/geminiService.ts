
import { storage } from './storage/unifiedStorage';
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

class GeminiService {
  private isInitialized = false;
  private supabaseUrl = 'https://yhxjzjyqlnizccswcpwq.supabase.co/functions/v1/gemini-api';
  private offlineMode = false;

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
      
      this.isInitialized = true;
      // Verify API availability
      await this.checkApiAvailability();
    } catch (error) {
      console.error('Error initializing Gemini service:', error);
    }
  }

  private async checkApiAvailability(): Promise<boolean> {
    if (this.offlineMode) {
      return false;
    }
    
    try {
      const response = await fetch(this.supabaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'check-api-key' })
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.exists === true;
    } catch (error) {
      console.error('Error checking API availability:', error);
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
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      // For system prompt, we need to format it properly
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\nUser: ${prompt}` 
        : prompt;

      const params = {
        ...DEFAULT_CONFIG,
        ...config
      };

      const response = await fetch(this.supabaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'chat',
          content: fullPrompt,
          options: params
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from Gemini AI');
      }

      const data = await response.json();
      return data.result;
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
      
      const response = await fetch(this.supabaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'summarize',
          content,
          language
        })
      });

      if (!response.ok) {
        throw new Error('Failed to summarize content');
      }

      const data = await response.json();
      return data.result;
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
      
      const response = await fetch(this.supabaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'categorize',
          content,
          language
        })
      });

      if (!response.ok) {
        throw new Error('Failed to categorize content');
      }

      const data = await response.json();
      return data.result;
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
      
      const response = await fetch(this.supabaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'suggest-timer',
          content: taskDescription,
          language
        })
      });

      if (!response.ok) {
        throw new Error('Failed to suggest timer duration');
      }

      const data = await response.json();
      const minutes = parseInt(data.result.replace(/\D/g, ''), 10);
      
      if (isNaN(minutes) || minutes < 5) {
        return 25; // Default Pomodoro duration
      }
      
      if (minutes > 120) {
        return 120; // Cap at 2 hours
      }
      
      return minutes;
    } catch (error) {
      console.error('Error suggesting timer duration:', error);
      throw error; // Propagate error for retry handling
    }
  }

  // Method to check if service is available
  public async isAvailable(): Promise<boolean> {
    if (this.offlineMode) {
      return false;
    }
    
    try {
      return await this.checkApiAvailability();
    } catch (error) {
      console.error('Error checking Gemini availability:', error);
      return false;
    }
  }
  
  // Public method to get offline status
  public isOffline(): boolean {
    return this.offlineMode;
  }
}

export const geminiService = new GeminiService();
