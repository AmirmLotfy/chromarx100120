
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";

const GEMINI_API_KEY = ""; // This will be configured later

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const summarizeContent = async (content: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(content);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error summarizing content:", error);
    toast.error("Failed to summarize content");
    return "Unable to generate summary at this time.";
  }
};

export const generateCategories = async (bookmarks: any[]): Promise<string[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const bookmarkTitles = bookmarks.map(b => b.title).join("\n");
    const prompt = `Generate relevant categories for these bookmarks:\n${bookmarkTitles}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const categories = response.text().split(",").map(c => c.trim());
    
    return categories;
  } catch (error) {
    console.error("Error generating categories:", error);
    toast.error("Failed to generate categories");
    return [];
  }
};

export const suggestBookmarkCategory = async (title: string, url: string, content: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Suggest a category for this bookmark:\nTitle: ${title}\nURL: ${url}\nContent: ${content}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error suggesting category:", error);
    toast.error("Failed to suggest category");
    return "uncategorized";
  }
};

export const summarizeBookmark = async (bookmark: any): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Summarize this bookmark:\nTitle: ${bookmark.title}\nURL: ${bookmark.url}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error summarizing bookmark:", error);
    toast.error("Failed to summarize bookmark");
    return "Unable to generate summary.";
  }
};

export const analyzeSentiment = async (content: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(`Analyze sentiment: ${content}`);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    toast.error("Failed to analyze sentiment");
    return "neutral";
  }
};

export const getGeminiResponse = async (options: { 
  prompt: string;
  type: string;
  language: string;
  contentType?: string;
}): Promise<{ result: string }> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(options.prompt);
    const response = await result.response;
    return { result: response.text() };
  } catch (error) {
    console.error("Error getting Gemini response:", error);
    toast.error("Failed to get AI response");
    return { result: "" };
  }
};

export const generateTaskSuggestions = async (taskDetails: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(`Suggest improvements for task: ${taskDetails}`);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    toast.error("Failed to generate suggestions");
    return "";
  }
};

export const suggestTimerDuration = async (taskDetails: string): Promise<number> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(`Suggest duration in minutes for task: ${taskDetails}`);
    const response = await result.response;
    const duration = parseInt(response.text(), 10);
    return isNaN(duration) ? 25 : duration;
  } catch (error) {
    console.error("Error suggesting timer duration:", error);
    toast.error("Failed to suggest duration");
    return 25;
  }
};
