import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";

const getGeminiModel = async () => {
  try {
    const authToken = await chrome.identity.getAuthToken({ interactive: true });
    if (!authToken) {
      throw new Error("Failed to get auth token");
    }

    const genAI = new GoogleGenerativeAI();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    return model;
  } catch (error) {
    console.error("Error getting Gemini model:", error);
    throw error;
  }
};

export const summarizeContent = async (prompt: string): Promise<string> => {
  try {
    const model = await getGeminiModel();
    const result = await model.generateContent(`Summarize this content in a concise way: ${prompt}`);
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

export const summarizeBookmark = async (content: string): Promise<string> => {
  return summarizeContent(content);
};