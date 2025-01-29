import { GoogleGenerativeAI } from "@google/generative-ai";

export async function summarizeContent(text: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Summarize this content concisely in 2-3 sentences:
    ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error summarizing content:', error);
    return 'Failed to generate summary';
  }
}

export async function translateContent(text: string, targetLanguage: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Translate this text to ${targetLanguage}:
    ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error translating content:', error);
    return 'Failed to translate content';
  }
}

export async function suggestBookmarkCategory(title: string, url: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Based on this bookmark's title and URL, suggest a single category (one word only):
    Title: ${title}
    URL: ${url}
    
    Reply with just the category name, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error suggesting category:', error);
    return 'Uncategorized';
  }
}