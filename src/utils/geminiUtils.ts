import { ChromeBookmark } from "@/types/bookmark";
import { fetchPageContent } from "./contentExtractor";
import { aiRequestManager } from "./aiRequestManager";
import { toast } from "sonner";
import { localStorageClient as supabase } from '@/lib/local-storage-client';
import { retryWithBackoff } from "./retryUtils";

interface GeminiRequest {
  prompt: string;
  type: 'summarize' | 'categorize' | 'timer' | 'sentiment' | 'task' | 'analytics';
  language: string;
  contentType?: string;
  maxRetries?: number;
}

interface GeminiResponse {
  result: string;
  error?: string;
}

// For local fallback responses when API is unavailable
const fallbackResponses = {
  summarize: "Unable to generate summary. Please try again later.",
  categorize: "uncategorized",
  sentiment: "neutral",
  task: "No task suggestions available.",
  timer: "25",
  analytics: "No analytics available."
};

export const getGeminiResponse = async (request: GeminiRequest): Promise<GeminiResponse> => {
  try {
    const result = await retryWithBackoff(
      () => callAIFunction(request.type, {
        content: request.prompt,
        language: request.language,
        contentType: request.contentType
      }),
      {
        maxRetries: request.maxRetries || 3,
        initialDelay: 1000,
        maxDelay: 10000,
        onRetry: (error, attempt) => {
          console.log(`Retry attempt ${attempt} for ${request.type} operation:`, error);
          if (attempt === 3) {
            toast.error(`Rate limit reached. Using fallback response.`);
          }
        }
      }
    );
    return { result };
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Enhanced error handling with more specific messages
    if (errorMessage.includes('rate') && errorMessage.includes('limit')) {
      toast.error("AI service rate limit reached. Please try again later.");
    } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      toast.error("Network issue detected. Check your connection and try again.");
    } else if (errorMessage.includes('auth') || errorMessage.includes('key')) {
      toast.error("Authentication issue with AI service. Please check your API key.");
    } else {
      toast.error(`AI service error: ${errorMessage}`);
    }
    
    // Use fallback responses based on operation type
    return { 
      result: fallbackResponses[request.type] || '', 
      error: errorMessage 
    };
  }
};

const callAIFunction = async (operation: string, params: any): Promise<string> => {
  try {
    // Check if Gemini API key is available in Supabase
    const { data: secretExists, error: secretError } = await supabase.functions.invoke('gemini-api', {
      body: { operation: 'check-api-key' }
    });

    if (secretError) {
      console.error('Error checking API key:', secretError);
      throw new Error('Failed to check API key status');
    }

    if (!secretExists || !secretExists.exists) {
      console.warn('Gemini API key not available');
      return fallbackResponses[operation] || 'API key not configured';
    }

    const { data, error } = await supabase.functions.invoke('gemini-api', {
      body: { operation, ...params }
    });

    if (error) throw error;
    return data.result;
  } catch (error) {
    console.error('Error calling AI function:', error);
    
    // Enhanced error type handling
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.message.includes('403')) {
        throw new Error('Access denied. Please check your API key.');
      } else if (error.message.includes('404')) {
        throw new Error('AI service endpoint not found. Please check configuration.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Request timed out. The AI service may be experiencing high load.');
      }
    }
    
    throw error;
  }
};

export const summarizeContent = async (content: string, language: string): Promise<string> => {
  return aiRequestManager.makeRequest(
    async () => callAIFunction('summarize', { content, language }),
    `summary_${content.slice(0, 50)}`,
    'Failed to generate summary'
  );
};

export const summarizeBookmark = async (bookmark: ChromeBookmark, language: string): Promise<string> => {
  try {
    let content = await fetchPageContent(bookmark.url || '');
    if (!content) {
      content = `Title: ${bookmark.title}\nURL: ${bookmark.url}`;
    }

    return aiRequestManager.makeRequest(
      async () => callAIFunction('summarize', { 
        content,
        language,
        url: bookmark.url,
        title: bookmark.title 
      }),
      `bookmark_summary_${bookmark.id}`,
      'Failed to generate bookmark summary'
    );
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    throw error;
  }
};

export const suggestBookmarkCategory = async (title: string, url: string, content: string, language: string): Promise<string> => {
  return aiRequestManager.makeRequest(
    async () => callAIFunction('categorize', { title, url, content, language }),
    `category_${url}`,
    'uncategorized'
  );
};

export const generateChatResponse = async (
  query: string,
  bookmarks: ChromeBookmark[],
  language: string
): Promise<string> => {
  const bookmarkContents = await Promise.all(
    bookmarks.map(async bookmark => ({
      title: bookmark.title,
      url: bookmark.url,
      content: await fetchPageContent(bookmark.url || '')
    }))
  );

  const content = `
Query: ${query}

Related Bookmarks:
${bookmarkContents.map(b => `
Title: ${b.title}
URL: ${b.url}
Content: ${b.content}
`).join('\n---\n')}
  `.trim();

  return aiRequestManager.makeRequest(
    async () => callAIFunction('chat', { content, language }),
    `chat_${query}_${bookmarks.map(b => b.id).join('_')}`,
    'Failed to generate chat response'
  );
};

export const generateTaskSuggestions = async (content: string, language: string): Promise<string> => {
  return aiRequestManager.makeRequest(
    async () => callAIFunction('task', { content, language }),
    `task_${content.slice(0, 50)}`,
    'Failed to generate task suggestions'
  );
};

export const analyzeProductivity = async (data: any, language: string): Promise<string> => {
  return aiRequestManager.makeRequest(
    async () => callAIFunction('analytics', { content: JSON.stringify(data), language }),
    `analytics_${Date.now()}`,
    'Failed to analyze productivity'
  );
};

export const suggestTimerDuration = async (task: string, language: string): Promise<number> => {
  const response = await aiRequestManager.makeRequest(
    async () => callAIFunction('suggest-timer', { content: task, language }),
    `timer_${task}`,
    '25'
  );
  const minutes = parseInt(response);
  return isNaN(minutes) ? 25 : minutes;
};

export const analyzeSentiment = async (content: string, language: string): Promise<'positive' | 'negative' | 'neutral'> => {
  const sentiment = await aiRequestManager.makeRequest(
    async () => callAIFunction('sentiment', { content, language }),
    `sentiment_${content.slice(0, 50)}`,
    'neutral'
  );
  return sentiment.toLowerCase().trim() as 'positive' | 'negative' | 'neutral';
};

export const checkGeminiAvailability = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-api', {
      body: { operation: 'check-api-key' }
    });

    if (error) {
      console.error('Error checking Gemini availability:', error);
      return false;
    }

    return data.exists === true;
  } catch (error) {
    console.error('Error checking Gemini availability:', error);
    return false;
  }
};

export const processBatchBookmarks = async (
  bookmarks: ChromeBookmark[], 
  operation: 'summarize' | 'categorize',
  language: string,
  batchSize = 5,
  onProgress?: (progress: number) => void
): Promise<ChromeBookmark[]> => {
  const results: ChromeBookmark[] = [];
  const totalBookmarks = bookmarks.length;
  
  // Process in smaller batches to avoid rate limits
  for (let i = 0; i < totalBookmarks; i += batchSize) {
    const batch = bookmarks.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (bookmark) => {
      try {
        let processedBookmark = { ...bookmark };
        
        if (operation === 'summarize' && bookmark.url) {
          const summary = await summarizeBookmark(bookmark, language);
          processedBookmark.metadata = {
            ...processedBookmark.metadata,
            summary
          };
        } else if (operation === 'categorize' && bookmark.url) {
          const content = await fetchPageContent(bookmark.url);
          const category = await suggestBookmarkCategory(
            bookmark.title,
            bookmark.url,
            content,
            language
          );
          processedBookmark.category = category;
        }
        
        return processedBookmark;
      } catch (error) {
        console.error(`Error processing bookmark ${bookmark.id}:`, error);
        // Return original bookmark if processing fails
        return bookmark;
      }
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // Keep original bookmark on failure
        results.push(batch[index]);
        console.error(`Failed to process bookmark: ${result.reason}`);
      }
    });
    
    // Report progress
    if (onProgress) {
      const progress = Math.min(100, Math.round(((i + batch.length) / totalBookmarks) * 100));
      onProgress(progress);
    }
    
    // Pause between batches to avoid rate limits
    if (i + batchSize < totalBookmarks) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
};

export const submitAIFeedback = async (
  operationType: string,
  result: string,
  feedback: 'positive' | 'negative',
  userSuggestion?: string
): Promise<void> => {
  try {
    await supabase.functions.invoke('gemini-api', {
      body: { 
        operation: 'feedback',
        operationType,
        result,
        feedback,
        userSuggestion
      }
    });
    
    toast.success('Thank you for your feedback!');
  } catch (error) {
    console.error('Error submitting AI feedback:', error);
    toast.error('Failed to submit feedback');
  }
};

export const testAIReliability = async (language: string): Promise<boolean> => {
  try {
    // Simple test to check if AI service is responding reliably
    const testResult = await getGeminiResponse({
      prompt: 'Test prompt for reliability check',
      type: 'sentiment',
      language,
      maxRetries: 1
    });
    
    return !testResult.error;
  } catch (error) {
    console.error('AI reliability test failed:', error);
    return false;
  }
};
