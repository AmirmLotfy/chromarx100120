
import { toast } from "sonner";
import { retryWithBackoff } from "./retryUtils";
import { ChromeBookmark } from "@/types/bookmark";

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; // This should be configured by users
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models";

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

async function makeGeminiRequest(prompt: string, type: string) {
  const cacheKey = `${type}-${prompt}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${GEMINI_API_URL}/gemini-pro:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GEMINI_API_KEY}`
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API request failed: ${response.statusText}`);
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
      const response = await makeGeminiRequest(
        `Please summarize the following content: ${content}`,
        'summarize'
      );
      return response.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Error summarizing content:", error);
      toast.error("Failed to summarize content");
      return "Unable to generate summary at this time.";
    }
  });
};

export const suggestBookmarkCategory = async (title: string, url: string, content: string): Promise<string> => {
  return retryWithBackoff(async () => {
    try {
      const response = await makeGeminiRequest(
        `Please suggest a category for this bookmark:\nTitle: ${title}\nURL: ${url}\nContent: ${content}`,
        'categorize'
      );
      return response.candidates[0].content.parts[0].text;
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
      const response = await makeGeminiRequest(
        `Analyze the sentiment of this text: ${content}`,
        'sentiment'
      );
      return response.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      toast.error("Failed to analyze sentiment");
      return "neutral";
    }
  });
};

export const generateTaskSuggestions = async (taskDetails: string): Promise<string> => {
  return retryWithBackoff(async () => {
    try {
      const response = await makeGeminiRequest(
        `Generate task suggestions based on: ${taskDetails}`,
        'tasks'
      );
      return response.candidates[0].content.parts[0].text;
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
      const response = await makeGeminiRequest(
        `Suggest a timer duration in minutes for this task: ${taskDetails}`,
        'timer'
      );
      const duration = parseInt(response.candidates[0].content.parts[0].text);
      return isNaN(duration) ? 25 : duration;
    } catch (error) {
      console.error("Error suggesting timer duration:", error);
      toast.error("Failed to suggest duration");
      return 25;
    }
  });
};
