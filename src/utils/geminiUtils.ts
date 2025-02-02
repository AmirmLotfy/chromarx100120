import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";
import { extractPageContent } from "./contentExtractor";
import { Language } from "@/stores/languageStore";

const getGeminiModel = async () => {
  try {
    if (typeof chrome === 'undefined' || !chrome.identity) {
      toast.error("This feature requires running as a Chrome extension");
      throw new Error("Chrome extension APIs not available");
    }

    const { token } = await chrome.identity.getAuthToken({ interactive: true });
    if (!token) {
      throw new Error("Failed to get auth token");
    }

    const genAI = new GoogleGenerativeAI(token);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    return model;
  } catch (error) {
    console.error("Error getting Gemini model:", error);
    throw error;
  }
};

export const summarizeContent = async (prompt: string, language: Language): Promise<string> => {
  try {
    const model = await getGeminiModel();
    const result = await model.generateContent(
      `Summarize this content in ${language.name} (${language.nativeName}). Focus on the main points and key information: ${prompt}`
    );
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error summarizing content:', error);
    toast.error("Failed to generate summary");
    throw error;
  }
};

export const suggestBookmarkCategory = async (title: string, url: string): Promise<string> => {
  try {
    const model = await getGeminiModel();
    const prompt = `Given this bookmark with title "${title}" and URL "${url}", suggest a single word category for it. Only respond with the category word, nothing else.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error suggesting category:', error);
    toast.error("Failed to suggest category");
    throw error;
  }
};

export const summarizeBookmark = async (bookmark: { title: string; url?: string }, language: Language): Promise<string> => {
  try {
    let content = `Title: ${bookmark.title}\n`;
    
    if (bookmark.url) {
      toast.loading("Fetching webpage content...");
      const pageContent = await extractPageContent(bookmark.url);
      content += `\nContent:\n${pageContent}`;
    }
    
    toast.loading("Generating summary...");
    return await summarizeContent(content, language);
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    toast.error("Failed to summarize bookmark");
    throw error;
  }
};