
import { ChromeBookmark } from '@/types/bookmark';
import { geminiService } from '@/services/geminiService';

// Use geminiService for all AI interactions with the built-in API key
export const getGeminiResponse = async (
  prompt: string,
  systemPrompt?: string,
  config?: any
): Promise<string> => {
  try {
    return await geminiService.getResponse(prompt, systemPrompt, config);
  } catch (error) {
    console.error("Error getting Gemini response:", error);
    return "Sorry, I encountered an error while processing your request.";
  }
};

export const summarizeContent = async (text: string, language: string = 'en'): Promise<string> => {
  try {
    return await geminiService.summarize(text, language);
  } catch (error) {
    console.error("Error summarizing content:", error);
    return "Failed to summarize content";
  }
};

export const summarizeBookmark = async (bookmark: ChromeBookmark, language: string = 'en'): Promise<string> => {
  try {
    const content = `URL: ${bookmark.url}
Title: ${bookmark.title}
Content: ${bookmark.content?.substring(0, 1500) || 'No content available'}...`;
    
    return await geminiService.summarize(content, language);
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    return 'Failed to generate summary.';
  }
};

export const suggestBookmarkCategory = async (title: string, url: string, content: string, language: string = 'en'): Promise<string> => {
  try {
    const fullContent = `Title: ${title}
URL: ${url}
Content: ${content ? content.substring(0, 1000) : 'No content available'}`;
    
    return await geminiService.categorize(fullContent, language);
  } catch (error) {
    console.error('Error categorizing bookmark:', error);
    return 'Uncategorized';
  }
};

export const generateTaskSuggestions = async (userContext: string, count: number = 3): Promise<string[]> => {
  try {
    const prompt = `Based on this context: "${userContext}", suggest ${count} tasks that would be appropriate. Return ONLY the task names as a numbered list, nothing else.`;
    
    const response = await getGeminiResponse(prompt);
    
    // Parse the response to extract tasks
    const tasks = response
      .split('\n')
      .filter(line => line.trim().match(/^\d+\.\s+.+/))
      .map(line => line.replace(/^\d+\.\s+/, '').trim());
    
    return tasks.slice(0, count);
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    return [];
  }
};

export const suggestTimerDuration = async (taskDescription: string): Promise<number> => {
  try {
    return await geminiService.suggestTimer(taskDescription);
  } catch (error) {
    console.error("Error suggesting timer duration:", error);
    return 25; // Default Pomodoro duration
  }
};

export const checkGeminiAvailability = async (): Promise<boolean> => {
  try {
    return await geminiService.isAvailable();
  } catch (error) {
    console.error("Error checking Gemini availability:", error);
    return false;
  }
};

// Test function
export const testAIReliability = async (): Promise<boolean> => {
  try {
    const prompt = "Respond with the exact text 'WORKING' if you can process this message.";
    const response = await getGeminiResponse(prompt);
    return response.includes('WORKING');
  } catch (error) {
    console.error("AI reliability test failed:", error);
    return false;
  }
};
