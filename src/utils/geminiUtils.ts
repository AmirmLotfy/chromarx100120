import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/chrome-utils";
import { ChromeBookmark } from "@/types/bookmark";
import { extractPageContent, cleanContent } from "./contentExtractor";

interface GeminiRequest {
  prompt: string;
  type: 'summarize' | 'categorize' | 'timer' | 'sentiment' | 'task' | 'analytics';
  language: string;
  contentType?: string;
}

interface GeminiResponse {
  result: string;
  error?: string;
}

const getGeminiClient = async () => {
  try {
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    const token = await user.getIdToken();
    const genAI = new GoogleGenerativeAI(token);
    return genAI.getGenerativeModel({ model: "gemini-pro" });
  } catch (error) {
    console.error('Error initializing Gemini client:', error);
    throw error;
  }
};

export const getGeminiResponse = async (request: GeminiRequest): Promise<GeminiResponse> => {
  try {
    const model = await getGeminiClient();
    const result = await model.generateContent(request.prompt);
    const response = await result.response;
    return { result: response.text() };
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    return { result: '', error: 'Failed to get AI response' };
  }
};

export const summarizeContent = async (content: string, language: string): Promise<string> => {
  const response = await getGeminiResponse({
    prompt: `Summarize this content concisely in ${language}, focusing on key points:\n\n${content}`,
    type: 'summarize',
    language
  });
  return response.result || 'Failed to generate summary';
};

export const summarizeBookmark = async (bookmark: ChromeBookmark, language: string): Promise<string> => {
  try {
    const pageContent = await extractPageContent(bookmark.url || '');
    const content = `
Title: ${bookmark.title}
URL: ${bookmark.url}
Content: ${cleanContent(pageContent)}
    `.trim();
    
    return await summarizeContent(content, language);
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    return await summarizeContent(`Title: ${bookmark.title}\nURL: ${bookmark.url}`, language);
  }
};

export const suggestBookmarkCategory = async (title: string, url: string): Promise<string> => {
  try {
    const pageContent = await extractPageContent(url);
    const content = `
Title: ${title}
URL: ${url}
Content: ${cleanContent(pageContent)}
    `.trim();
    
    const response = await getGeminiResponse({
      prompt: `Based on this content, suggest a single category name that best describes this bookmark:\n\n${content}`,
      type: 'categorize',
      language: 'en'
    });
    return response.result || 'uncategorized';
  } catch (error) {
    console.error('Error suggesting category:', error);
    return 'uncategorized';
  }
};

export const generateTaskSuggestions = async (content: string): Promise<string> => {
  const response = await getGeminiResponse({
    prompt: `Based on this content, suggest actionable tasks:\n\n${content}`,
    type: 'task',
    language: 'en'
  });
  return response.result || 'Failed to generate task suggestions';
};

export const analyzeProductivity = async (data: any): Promise<string> => {
  const response = await getGeminiResponse({
    prompt: `Analyze this productivity data and provide insights:\n\n${JSON.stringify(data)}`,
    type: 'analytics',
    language: 'en'
  });
  return response.result || 'Failed to analyze productivity';
};

export const suggestTimerDuration = async (task: string): Promise<number> => {
  const response = await getGeminiResponse({
    prompt: `Suggest an optimal duration in minutes for this task:\n\n${task}`,
    type: 'timer',
    language: 'en'
  });
  const minutes = parseInt(response.result);
  return isNaN(minutes) ? 25 : minutes;
};

export const analyzeSentiment = async (content: string): Promise<'positive' | 'negative' | 'neutral'> => {
  const response = await getGeminiResponse({
    prompt: `Analyze the sentiment of this content and respond with exactly one word (positive, negative, or neutral):\n\n${content}`,
    type: 'sentiment',
    language: 'en'
  });
  const sentiment = response.result.toLowerCase().trim();
  return sentiment === 'positive' || sentiment === 'negative' ? sentiment : 'neutral';
};