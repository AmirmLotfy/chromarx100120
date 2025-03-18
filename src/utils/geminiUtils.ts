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
    const prompt = `Summarize this text in 3 concise bullet points in ${language} language: ${text}`;
    return await getGeminiResponse(prompt);
  } catch (error) {
    console.error("Error summarizing content:", error);
    return "Failed to summarize content";
  }
};

export const summarizeBookmark = async (bookmark: ChromeBookmark, language: string = 'en'): Promise<string> => {
  try {
    const prompt = `Please summarize the content of this webpage in three concise bullet points in ${language} language:
    
URL: ${bookmark.url}
Title: ${bookmark.title}
Content: ${bookmark.content?.substring(0, 1500) || 'No content available'}...`;
    
    return await getGeminiResponse(prompt);
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    return 'Failed to generate summary.';
  }
};

export const suggestBookmarkCategory = async (title: string, url: string, content: string, language: string = 'en'): Promise<string> => {
  try {
    const prompt = `Categorize this content into one of these categories: Work, Personal, Research, Shopping, Travel, Finance, Technology, Entertainment, Education, Health.
    
Title: ${title}
URL: ${url}
Content: ${content ? content.substring(0, 1000) : 'No content available'}

Return only the category name in ${language} language, nothing else.`;
    
    const response = await getGeminiResponse(prompt);
    return response.trim();
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
    const prompt = `Based on this task description: "${taskDescription}", suggest an appropriate timer duration in minutes. Return ONLY a number representing minutes (between 5 and 120), nothing else.`;
    
    const response = await getGeminiResponse(prompt);
    
    // Extract number from response
    const minutes = parseInt(response.replace(/\D/g, ''), 10);
    
    // Validate the response
    if (isNaN(minutes) || minutes < 5) {
      return 25; // Default Pomodoro duration
    }
    
    if (minutes > 120) {
      return 120; // Cap at 2 hours
    }
    
    return minutes;
  } catch (error) {
    console.error("Error suggesting timer duration:", error);
    return 25; // Default to standard Pomodoro duration
  }
};

export const checkGeminiAvailability = async (): Promise<boolean> => {
  try {
    return await testAIReliability();
  } catch (error) {
    console.error("Error checking Gemini availability:", error);
    return false;
  }
};

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
