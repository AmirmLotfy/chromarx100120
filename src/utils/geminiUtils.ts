
/**
 * Gemini Utilities
 * Wrapper functions for the Gemini API service
 */
import { geminiService } from "@/services/geminiService";

/**
 * Check if the Gemini API is available
 */
export const checkGeminiAvailability = async (): Promise<boolean> => {
  return geminiService.checkAvailability();
};

/**
 * Summarize content
 */
export const summarizeContent = async (content: string, language = "en"): Promise<string> => {
  return geminiService.summarizeContent(content, language);
};

/**
 * Summarize a bookmark
 */
export const summarizeBookmark = async (bookmark: { title: string; url?: string }, language = "en"): Promise<string> => {
  const content = `Title: ${bookmark.title}\nURL: ${bookmark.url || 'No URL'}`;
  return geminiService.summarizeContent(content, language);
};

/**
 * Suggest a category for a bookmark
 */
export const suggestBookmarkCategory = async (
  title: string, 
  url: string, 
  content: string = "",
  language = "en"
): Promise<string> => {
  return geminiService.suggestBookmarkCategory(title, url, content, language);
};

/**
 * Analyze sentiment of content
 */
export const analyzeSentiment = async (content: string, language = "en"): Promise<"positive" | "negative" | "neutral"> => {
  return geminiService.analyzeSentiment(content, language);
};

/**
 * Suggest tasks based on content
 */
export const suggestTasks = async (content: string, language = "en"): Promise<string[]> => {
  return geminiService.suggestTasks(content, language);
};
