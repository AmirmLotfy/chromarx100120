
import { toast } from "sonner";
import { retryWithBackoff } from "./retryUtils";
import { ChromeBookmark } from "@/types/bookmark";

const API_BASE_URL = "https://chromarx.it.com/api";

// Cache implementation with TTL
const cache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

const getCached = (key: string) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.value;
};

const setCached = (key: string, value: any) => {
  cache.set(key, { value, timestamp: Date.now() });
};

async function makeRequest(endpoint: string, data: any) {
  const cacheKey = `${endpoint}-${JSON.stringify(data)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  const result = await response.json();
  setCached(cacheKey, result);
  return result;
}

export const batchProcessBookmarks = async (bookmarks: ChromeBookmark[], operation: 'summarize' | 'categorize'): Promise<Map<string, string>> => {
  const results = new Map<string, string>();
  const batchSize = 5; // Process 5 bookmarks at a time

  for (let i = 0; i < bookmarks.length; i += batchSize) {
    const batch = bookmarks.slice(i, i + batchSize);
    const promises = batch.map(async (bookmark) => {
      try {
        let result;
        if (operation === 'summarize') {
          result = await summarizeContent(bookmark.title);
        } else {
          result = await suggestBookmarkCategory(bookmark.title, bookmark.url || "", bookmark.content || "");
        }
        results.set(bookmark.id, result);
      } catch (error) {
        console.error(`Error processing bookmark ${bookmark.id}:`, error);
        results.set(bookmark.id, operation === 'summarize' ? 'Failed to generate summary' : 'uncategorized');
      }
    });

    await Promise.all(promises);
    toast.success(`Processed ${Math.min((i + batchSize), bookmarks.length)} of ${bookmarks.length} bookmarks`);
  }

  return results;
};

export const summarizeContent = async (content: string): Promise<string> => {
  return retryWithBackoff(async () => {
    try {
      const data = await makeRequest(`${API_BASE_URL}/summarize`, { content });
      return data.summary;
    } catch (error) {
      console.error("Error summarizing content:", error);
      toast.error("Failed to summarize content");
      return "Unable to generate summary at this time.";
    }
  }, {
    maxRetries: 3,
    onRetry: (error, attempt) => toast.error(`Retry attempt ${attempt} after error: ${error.message}`)
  });
};

export const generateCategories = async (bookmarks: ChromeBookmark[]): Promise<string[]> => {
  return retryWithBackoff(async () => {
    try {
      const data = await makeRequest(`${API_BASE_URL}/generate-categories`, { bookmarks });
      return data.categories;
    } catch (error) {
      console.error("Error generating categories:", error);
      toast.error("Failed to generate categories");
      return [];
    }
  });
};

export const suggestBookmarkCategory = async (title: string, url: string, content: string): Promise<string> => {
  return retryWithBackoff(async () => {
    try {
      const data = await makeRequest(`${API_BASE_URL}/suggest-category`, { title, url, content });
      return data.category;
    } catch (error) {
      console.error("Error suggesting category:", error);
      toast.error("Failed to suggest category");
      return "uncategorized";
    }
  });
};

export const analyzeSentiment = async (content: string): Promise<string> => {
  return retryWithBackoff(async () => {
    try {
      const data = await makeRequest(`${API_BASE_URL}/analyze-sentiment`, { content });
      return data.sentiment;
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      toast.error("Failed to analyze sentiment");
      return "neutral";
    }
  });
};

export const getGeminiResponse = async (options: { 
  prompt: string;
  type: string;
}): Promise<{ result: string }> => {
  return retryWithBackoff(async () => {
    try {
      const data = await makeRequest(`${API_BASE_URL}/gemini-response`, options);
      return { result: data.result };
    } catch (error) {
      console.error("Error getting Gemini response:", error);
      toast.error("Failed to get AI response");
      return { result: "" };
    }
  });
};

export const generateTaskSuggestions = async (taskDetails: string): Promise<string> => {
  return retryWithBackoff(async () => {
    try {
      const data = await makeRequest(`${API_BASE_URL}/generate-task-suggestions`, { taskDetails });
      return data.suggestions;
    } catch (error) {
      console.error("Error generating task suggestions:", error);
      toast.error("Failed to generate suggestions");
      return "";
    }
  });
};

export const suggestTimerDuration = async (taskDetails: string): Promise<number> => {
  return retryWithBackoff(async () => {
    try {
      const data = await makeRequest(`${API_BASE_URL}/suggest-timer-duration`, { taskDetails });
      return data.duration || 25;
    } catch (error) {
      console.error("Error suggesting timer duration:", error);
      toast.error("Failed to suggest duration");
      return 25;
    }
  });
};

