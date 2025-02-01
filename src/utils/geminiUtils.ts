import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractPageContent } from "./contentExtractor";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const summarizeContent = async (content: string, language: string = 'en', contentType: string = 'general') => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `
As an expert content summarizer, create a comprehensive yet concise summary of the following ${contentType} content in ${language}.
Focus on the key points and main ideas while maintaining clarity and coherence.
If the content is technical, preserve important technical details.
If it's an article or blog post, capture the main arguments and conclusions.

Content to summarize:
${content}

Provide a summary that is:
- Clear and well-structured
- 2-3 sentences long
- Captures the essential information
- Maintains the original tone and technical accuracy where relevant
`;

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
  
  const prompt = `
Analyze this content and suggest the most appropriate single category in ${language}.
Consider both the title and content when determining the category.
Choose from common bookmark categories like:
- Technology
- Development
- Business
- Education
- Entertainment
- News
- Science
- Health
- Travel
Or suggest a more specific category if clearly warranted.

Content to categorize:
Title: ${title}
URL: ${url}

Respond with just the category name, no explanation.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};