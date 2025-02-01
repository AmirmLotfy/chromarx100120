import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractPageContent } from "./contentExtractor";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const summarizeContent = async (content: string, language: string = 'en') => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `Summarize the following content in ${language}:\n${content}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

export const summarizeBookmark = async (
  title: string,
  url: string,
  language: string = 'en'
) => {
  try {
    // Extract page content
    const pageContent = await extractPageContent(url);
    
    // Combine title and content for context
    const fullContent = `
Title: ${title}
URL: ${url}
Content: ${pageContent}
    `.trim();
    
    return await summarizeContent(fullContent, language);
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    // Fallback to title-only summary if content extraction fails
    return summarizeContent(`${title}\n${url}`, language);
  }
};

export const suggestBookmarkCategory = async (
  title: string,
  url: string,
  language: string = 'en'
) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `Suggest a single category for this bookmark in ${language}:\nTitle: ${title}\nURL: ${url}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};