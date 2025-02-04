import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/chrome-utils";
import { ChromeBookmark } from "@/types/bookmark";

interface GeminiRequest {
  prompt: string;
  type: 'summarize' | 'categorize' | 'timer' | 'sentiment';
  language: string;
  contentType?: string;
}

export const getGeminiResponse = async (request: GeminiRequest) => {
  try {
    const model = await getGeminiClient();
    const result = await model.generateContent(request.prompt);
    const response = await result.response;
    return { result: response.text() };
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    throw error;
  }
};

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

export const summarizeContent = async (content: string, language: string): Promise<string> => {
  try {
    const model = await getGeminiClient();
    const prompt = `Summarize the following content in ${language}:\n${content}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
};

export const analyzeSentiment = async (content: string, language: string): Promise<string> => {
  try {
    const model = await getGeminiClient();
    const prompt = `Analyze the sentiment of the following content in ${language}:\n${content}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw error;
  }
};

export const summarizeBookmark = async (bookmark: ChromeBookmark, language: string): Promise<string> => {
  const content = `Title: ${bookmark.title}\nURL: ${bookmark.url}`;
  return await summarizeContent(content, language);
};

export const suggestBookmarkCategory = async (title: string, url: string): Promise<string> => {
  try {
    const model = await getGeminiClient();
    const prompt = `Suggest a category for this bookmark:\nTitle: ${title}\nURL: ${url}\nProvide only the category name, nothing else.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error suggesting category:', error);
    throw error;
  }
};