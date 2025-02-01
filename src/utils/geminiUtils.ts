import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractPageContent } from "./contentExtractor";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const summarizeContent = async (content: string, language: string = 'en', contentType: string = 'general') => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent({
    prompt: content,
    type: 'summarize',
    language,
    contentType
  });
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
    
    // Determine content type based on URL or content analysis
    const contentType = url.includes('github.com') ? 'technical' : 
                       url.includes('medium.com') ? 'article' : 'general';
    
    // Combine title and content for context
    const fullContent = `
Title: ${title}
URL: ${url}
Content: ${pageContent}
    `.trim();
    
    return await summarizeContent(fullContent, language, contentType);
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    // Fallback to title-only summary if content extraction fails
    return summarizeContent(`${title}\n${url}`, language, 'general');
  }
};

export const suggestBookmarkCategory = async (
  title: string,
  url: string,
  language: string = 'en'
) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent({
    prompt: `${title}\n${url}`,
    type: 'categorize',
    language
  });
  const response = await result.response;
  return response.text();
};