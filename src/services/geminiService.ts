
/**
 * Gemini API Service
 * Provides access to Google's Gemini AI model without requiring user API keys
 */
import { configurationService } from './configurationService';
import { toast } from 'sonner';

// Default Gemini API configuration type
export interface GeminiConfig {
  apiKey: string;
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
  maxRetries: number;
}

// Rate limiting implementation
const RATE_LIMIT = 50; // Requests per hour
let requestCount = 0;
let rateLimitReset = Date.now() + 60 * 60 * 1000;

// Check if we're above rate limit
const checkRateLimit = (): boolean => {
  const now = Date.now();
  
  // Reset counter if the hour has passed
  if (now > rateLimitReset) {
    requestCount = 0;
    rateLimitReset = now + 60 * 60 * 1000;
  }
  
  // Check if we're at the limit
  if (requestCount >= RATE_LIMIT) {
    return false;
  }
  
  // Increment the counter
  requestCount++;
  return true;
};

interface GeminiOptions {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  contentType?: string;
}

export const geminiService = {
  /**
   * Get a response from Gemini API
   */
  async getResponse(prompt: string, options: GeminiOptions = {}): Promise<string> {
    try {
      // Check rate limit
      if (!checkRateLimit()) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      
      // Get API configuration
      const config = await configurationService.getGeminiConfig() as GeminiConfig;
      
      // Set up API request
      const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
      const apiKey = config.apiKey;
      
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: options.temperature || config.temperature,
          topK: options.topK || config.topK,
          topP: options.topP || config.topP,
          maxOutputTokens: options.maxOutputTokens || config.maxOutputTokens
        }
      };
      
      // Make the API request
      const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get response from Gemini');
      }
      
      const data = await response.json();
      
      // Extract text from response
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  },
  
  /**
   * Check if the Gemini API is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await this.getResponse("Hello, are you available?", {
        maxOutputTokens: 10
      });
      return !!response;
    } catch (error) {
      console.error("Gemini API unavailable:", error);
      return false;
    }
  },
  
  /**
   * Summarize content
   */
  async summarizeContent(content: string, language = "en"): Promise<string> {
    try {
      const prompt = `Summarize the following content in a concise way that captures the main points. Output should be 2-3 paragraphs maximum. Language: ${language}\n\nContent: ${content}`;
      return await this.getResponse(prompt);
    } catch (error) {
      console.error("Error summarizing content:", error);
      toast.error("Failed to summarize content");
      throw error;
    }
  },
  
  /**
   * Suggest a category for a bookmark
   */
  async suggestBookmarkCategory(title: string, url: string, content: string, language = "en"): Promise<string> {
    try {
      const prompt = `Given the following content, suggest a single category that best describes it. Return only the category name, nothing else. Language: ${language}\n\nTitle: ${title}\nURL: ${url}\nContent: ${content}`;
      return await this.getResponse(prompt, {
        maxOutputTokens: 100
      });
    } catch (error) {
      console.error("Error suggesting category:", error);
      toast.error("Failed to suggest category");
      throw error;
    }
  },
  
  /**
   * Analyze sentiment of content
   */
  async analyzeSentiment(content: string, language = "en"): Promise<"positive" | "negative" | "neutral"> {
    try {
      const prompt = `Analyze the sentiment of the following content. Return only one word: "positive", "negative", or "neutral". Language: ${language}\n\nContent: ${content}`;
      const result = await this.getResponse(prompt, {
        maxOutputTokens: 50
      });
      
      const sentiment = result.toLowerCase().trim();
      if (sentiment === "positive" || sentiment === "negative" || sentiment === "neutral") {
        return sentiment as "positive" | "negative" | "neutral";
      }
      
      return "neutral";
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      return "neutral";
    }
  },
  
  /**
   * Suggest tasks based on content
   */
  async suggestTasks(content: string, language = "en"): Promise<string[]> {
    try {
      const prompt = `Given the following content, suggest actionable tasks that could be derived from it. Format as a numbered list. Language: ${language}\n\nContent: ${content}`;
      const result = await this.getResponse(prompt);
      
      // Parse the numbered list
      const tasks = result.split(/\d+\.\s+/).filter(Boolean).map(task => task.trim());
      return tasks;
    } catch (error) {
      console.error("Error suggesting tasks:", error);
      return [];
    }
  }
};
