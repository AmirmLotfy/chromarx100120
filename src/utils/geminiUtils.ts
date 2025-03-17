
import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

// Default configuration for generation
const defaultConfig: GenerationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
};

interface ApiResponse {
  content: string;
  model: string;
  prompt: string;
}

export const getGeminiResponse = async (
  prompt: string,
  systemPrompt?: string,
  config?: Partial<GenerationConfig>
): Promise<string> => {
  try {
    // Retrieve API key from storage
    const apiKey = await fetchGeminiApiKey();
    
    if (!apiKey) {
      console.error("Gemini API key not found");
      return "Error: API key not configured. Please set up your API key in settings.";
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const generationConfig = { ...defaultConfig, ...config };
    
    // For system prompt, prepend to user prompt with proper formatting
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\nUser: ${prompt}` 
      : prompt;
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Error getting Gemini response:", error);
    return "Sorry, I encountered an error while processing your request.";
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

const fetchGeminiApiKey = async (): Promise<string> => {
  try {
    // Fetch from chrome storage instead of configuration service for simplicity
    const keys = await chrome.storage.local.get('gemini_api_key');
    return keys.gemini_api_key || '';
  } catch (error) {
    console.error("Error fetching Gemini API key:", error);
    return '';
  }
};
