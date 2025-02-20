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

export const suggestOrganization = async (bookmarks: any[]): Promise<{ category: string; bookmarkIds: string[] }[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const bookmarkData = bookmarks.map(b => ({
      id: b.id,
      title: b.title,
      url: b.url
    }));
    
    const prompt = `Suggest organization for these bookmarks:\n${JSON.stringify(bookmarkData)}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestions = JSON.parse(response.text());
    
    return suggestions;
  } catch (error) {
    console.error("Error suggesting organization:", error);
    toast.error("Failed to suggest organization");
    return [];
  }
};

export const generateSummary = async (url: string, content: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Summarize this webpage content from ${url}:\n${content}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating summary:", error);
    toast.error("Failed to generate summary");
    return "Unable to generate summary at this time.";
  }
};

export const analyzeBookmarks = async (bookmarks: any[]): Promise<any> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const bookmarkData = bookmarks.map(b => ({
      title: b.title,
      url: b.url,
      dateAdded: b.dateAdded
    }));
    
    const prompt = `Analyze these bookmarks and provide insights:\n${JSON.stringify(bookmarkData)}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Error analyzing bookmarks:", error);
    toast.error("Failed to analyze bookmarks");
    return null;
  }
};
