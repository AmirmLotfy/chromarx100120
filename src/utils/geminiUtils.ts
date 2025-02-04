import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/chrome-utils";
import { ChromeBookmark } from "@/types/bookmark";
import { extractPageContent, cleanContent } from "./contentExtractor";

interface GeminiRequest {
  prompt: string;
  type: 'summarize' | 'categorize' | 'timer' | 'sentiment';
  language: string;
  contentType?: string;
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

export const summarizeContent = async (content: string, language: string): Promise<string> => {
  try {
    const model = await getGeminiClient();
    const prompt = `Summarize the following content in ${language}. Focus on key points and main ideas:\n\n${content}`;
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
  try {
    let content = `Title: ${bookmark.title}\n`;
    
    if (bookmark.url) {
      content += `URL: ${bookmark.url}\n\n`;
      // Extract and include page content
      const pageContent = await extractPageContent(bookmark.url);
      if (pageContent) {
        content += `Content:\n${cleanContent(pageContent)}`;
      }
    }
    
    return await summarizeContent(content, language);
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    // Fallback to title-only summary if content extraction fails
    return await summarizeContent(`Title: ${bookmark.title}\nURL: ${bookmark.url || ""}`, language);
  }
};

export const suggestBookmarkCategory = async (title: string, url: string): Promise<string> => {
  try {
    const model = await getGeminiClient();
    let content = `Title: ${title}\nURL: ${url}\n`;
    
    try {
      // Try to get page content for better categorization
      const pageContent = await extractPageContent(url);
      if (pageContent) {
        content += `\nContent: ${cleanContent(pageContent).slice(0, 1000)}`; // First 1000 chars for context
      }
    } catch (error) {
      console.error('Error getting page content for categorization:', error);
      // Continue with title/URL only if content extraction fails
    }
    
    const prompt = `Based on this content, suggest a single category that best describes this bookmark. Provide only the category name, nothing else:\n\n${content}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error suggesting category:', error);
    throw error;
  }
};

// Enhanced chat context generation
export const generateChatContext = async (bookmarks: ChromeBookmark[]): Promise<string> => {
  try {
    const contextPromises = bookmarks.map(async (bookmark) => {
      if (!bookmark.url) return '';
      
      const pageContent = await extractPageContent(bookmark.url);
      return `Title: ${bookmark.title}\nURL: ${bookmark.url}\nContent: ${cleanContent(pageContent)}\n---\n`;
    });
    
    const contexts = await Promise.all(contextPromises);
    return contexts.join('\n');
  } catch (error) {
    console.error('Error generating chat context:', error);
    return '';
  }
};