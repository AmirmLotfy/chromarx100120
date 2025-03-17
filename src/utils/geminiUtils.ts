
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
 * Get a response from Gemini API
 */
export const getGeminiResponse = async (prompt: string, options = {}): Promise<string> => {
  return geminiService.getResponse(prompt, options);
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

/**
 * Generate task suggestions
 */
export const generateTaskSuggestions = async (context: string): Promise<any[]> => {
  try {
    // Default suggestions if API fails
    const defaultSuggestions = [
      { title: "Review documents", description: "Review and organize documents", priority: "medium", category: "Work" },
      { title: "Schedule meeting", description: "Schedule team sync meeting", priority: "high", category: "Work" },
      { title: "Workout session", description: "30-minute cardio workout", priority: "medium", category: "Health" }
    ];
    
    if (!context) return defaultSuggestions;
    
    const prompt = `Generate 3 task suggestions based on the following context: ${context}. For each task, provide a title, description, priority (low, medium, high), and category (Work, Personal, Learning, Health). Return as JSON array.`;
    
    const response = await geminiService.getResponse(prompt);
    
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : defaultSuggestions;
    } catch (e) {
      console.error('Failed to parse task suggestions', e);
      return defaultSuggestions;
    }
  } catch (error) {
    console.error('Error generating task suggestions:', error);
    return [
      { title: "Review documents", description: "Review and organize documents", priority: "medium", category: "Work" },
      { title: "Schedule meeting", description: "Schedule team sync meeting", priority: "high", category: "Work" },
      { title: "Workout session", description: "30-minute cardio workout", priority: "medium", category: "Health" }
    ];
  }
};

/**
 * Suggest timer duration
 */
export const suggestTimerDuration = async (taskContext: string, mode: "focus" | "break"): Promise<number> => {
  try {
    if (!taskContext) {
      return mode === "focus" ? 25 : 5; // Default Pomodoro values
    }
    
    const prompt = `Based on this task: "${taskContext}", suggest an appropriate ${mode} timer duration in minutes. Return only a number between 15-90 for focus or 5-15 for break.`;
    
    const response = await geminiService.getResponse(prompt, { maxOutputTokens: 50 });
    const duration = parseInt(response.trim());
    
    if (isNaN(duration)) {
      return mode === "focus" ? 25 : 5;
    }
    
    // Ensure reasonable limits
    if (mode === "focus") {
      return Math.min(Math.max(duration, 15), 90);
    } else {
      return Math.min(Math.max(duration, 5), 15);
    }
  } catch (error) {
    console.error('Error suggesting timer duration:', error);
    return mode === "focus" ? 25 : 5;
  }
};

/**
 * Test AI reliability
 */
export const testAIReliability = async (): Promise<boolean> => {
  try {
    const response = await geminiService.getResponse("Test connection. Reply with 'Connected'.");
    return response.toLowerCase().includes("connected");
  } catch (error) {
    console.error('AI reliability test failed:', error);
    return false;
  }
};
