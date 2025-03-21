
import { ChromeBookmark } from '@/types/bookmark';
import { geminiService } from '@/services/geminiService';
import { toast } from 'sonner';
import { unifiedCache } from './unifiedCacheManager';

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second delay between retries

/**
 * Retry a function with exponential backoff
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    console.log(`Retrying operation after ${delay}ms, ${retries} retries left`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return withRetry(fn, retries - 1, delay * 2);
  }
};

// Use geminiService for all AI interactions with the built-in API key
export const getGeminiResponse = async (
  prompt: string,
  systemPrompt?: string,
  config?: any
): Promise<string> => {
  const cacheKey = `gemini_${prompt.substring(0, 100)}_${systemPrompt?.substring(0, 50) || ''}`;
  
  try {
    // Use unified cache system for better offline support and consistency
    return await unifiedCache.getData(
      cacheKey,
      () => withRetry(() => geminiService.getResponse(prompt, systemPrompt, config)),
      {
        ttl: 60, // Cache for 1 hour
        priority: 'normal',
        cacheInMemory: true
      }
    );
  } catch (error) {
    console.error("Error getting Gemini response:", error);
    toast.error("Failed to get response from AI service");
    return "Sorry, I encountered an error while processing your request.";
  }
};

export const summarizeContent = async (text: string, language: string = 'en'): Promise<string> => {
  const cacheKey = `summary_${text.substring(0, 100)}_${language}`;
  
  try {
    return await unifiedCache.getData(
      cacheKey,
      () => withRetry(() => geminiService.summarize(text, language)),
      {
        ttl: 1440, // Cache for 24 hours
        priority: 'high',
        preferredSource: 'indexedDb'
      }
    );
  } catch (error) {
    console.error("Error summarizing content:", error);
    return "Failed to summarize content";
  }
};

export const summarizeBookmark = async (bookmark: ChromeBookmark, language: string = 'en'): Promise<string> => {
  if (!bookmark.url) {
    return 'Failed to generate summary: Bookmark URL is missing.';
  }
  
  const cacheKey = `bookmark_summary_${bookmark.id}_${language}`;
  
  try {
    return await unifiedCache.getData(
      cacheKey,
      async () => {
        const content = `URL: ${bookmark.url}
Title: ${bookmark.title}
Content: ${bookmark.content?.substring(0, 1500) || 'No content available'}...`;
        
        return await withRetry(() => geminiService.summarize(content, language));
      },
      {
        ttl: 10080, // Cache for 1 week
        priority: 'high'
      }
    );
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    return 'Failed to generate summary.';
  }
};

export const suggestBookmarkCategory = async (title: string, url: string, content: string, language: string = 'en'): Promise<string> => {
  const cacheKey = `category_${url.substring(0, 100)}_${language}`;
  
  try {
    return await unifiedCache.getData(
      cacheKey,
      async () => {
        const fullContent = `Title: ${title}
URL: ${url}
Content: ${content ? content.substring(0, 1000) : 'No content available'}`;
        
        return await withRetry(() => geminiService.categorize(fullContent, language));
      },
      {
        ttl: 10080, // Cache for 1 week
        priority: 'normal'
      }
    );
  } catch (error) {
    console.error('Error categorizing bookmark:', error);
    return 'Uncategorized';
  }
};

export const generateTaskSuggestions = async (userContext: string, count: number = 3): Promise<string[]> => {
  const cacheKey = `tasks_${userContext.substring(0, 100)}_${count}`;
  
  try {
    return await unifiedCache.getData(
      cacheKey,
      async () => {
        const prompt = `Based on this context: "${userContext}", suggest ${count} tasks that would be appropriate. Return ONLY the task names as a numbered list, nothing else.`;
        
        const response = await withRetry(() => getGeminiResponse(prompt));
        
        // Parse the response to extract tasks
        const tasks = response
          .split('\n')
          .filter(line => line.trim().match(/^\d+\.\s+.+/))
          .map(line => line.replace(/^\d+\.\s+/, '').trim());
        
        return tasks.slice(0, count);
      },
      {
        ttl: 1440, // Cache for 24 hours
        priority: 'normal'
      }
    );
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    return [];
  }
};

export const suggestTimerDuration = async (taskDescription: string): Promise<number> => {
  const cacheKey = `timer_${taskDescription.substring(0, 100)}`;
  
  try {
    return await unifiedCache.getData(
      cacheKey,
      () => withRetry(() => geminiService.suggestTimer(taskDescription)),
      {
        ttl: 4320, // Cache for 3 days
        priority: 'low'
      }
    );
  } catch (error) {
    console.error("Error suggesting timer duration:", error);
    return 25; // Default Pomodoro duration
  }
};

export const checkGeminiAvailability = async (): Promise<boolean> => {
  try {
    // Don't cache this - we need to check actual availability
    const isAvailable = await withRetry(() => geminiService.isAvailable());
    console.log("Gemini API availability:", isAvailable);
    return isAvailable;
  } catch (error) {
    console.error("Error checking Gemini availability:", error);
    return false;
  }
};

// Test function
export const testAIReliability = async (): Promise<boolean> => {
  try {
    const prompt = "Respond with the exact text 'WORKING' if you can process this message.";
    const response = await withRetry(() => getGeminiResponse(prompt));
    return response.includes('WORKING');
  } catch (error) {
    console.error("AI reliability test failed:", error);
    return false;
  }
};
