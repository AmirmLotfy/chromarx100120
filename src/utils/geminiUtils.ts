import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/chrome-utils";
import { ChromeBookmark } from "@/types/bookmark";
import { fetchPageContent } from "./contentExtractor";

interface GeminiRequest {
  prompt: string;
  type: 'summarize' | 'categorize' | 'timer' | 'sentiment' | 'task' | 'analytics';
  language: string;
  contentType?: string;
}

interface GeminiResponse {
  result: string;
  error?: string;
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

export const getGeminiResponse = async (request: GeminiRequest): Promise<GeminiResponse> => {
  try {
    const model = await getGeminiClient();
    const result = await model.generateContent(request.prompt);
    const response = await result.response;
    return { result: response.text() };
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    return { result: '', error: 'Failed to get AI response' };
  }
};

export const summarizeBookmark = async (bookmark: ChromeBookmark, language: string): Promise<string> => {
  try {
    const pageContent = await fetchPageContent(bookmark.url || '');
    const prompt = `
Title: ${bookmark.title}
URL: ${bookmark.url}
Content: ${pageContent}

Please provide a comprehensive summary of this content in ${language}, focusing on:
1. Main topics and key points
2. Important details and findings
3. Conclusions or outcomes
    `.trim();

    const response = await getGeminiResponse({
      prompt,
      type: 'summarize',
      language
    });
    return response.result || 'Failed to generate summary';
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    return `Failed to summarize ${bookmark.title}`;
  }
};

export const suggestBookmarkCategory = async (title: string, url: string): Promise<string> => {
  try {
    const pageContent = await fetchPageContent(url);
    const prompt = `
Based on this content:
Title: ${title}
URL: ${url}
Content: ${pageContent}

Suggest a single, specific category that best describes this bookmark. Choose from common categories like:
- Technology
- Business
- Science
- Health
- Education
- Entertainment
- News
- Personal
- Shopping
- Social Media
- Reference
- Other (with specific suggestion)

Respond with ONLY the category name, nothing else.
    `.trim();

    const response = await getGeminiResponse({
      prompt,
      type: 'categorize',
      language: 'en'
    });
    return response.result.trim() || 'uncategorized';
  } catch (error) {
    console.error('Error suggesting category:', error);
    return 'uncategorized';
  }
};

export const generateChatResponse = async (
  query: string,
  bookmarks: ChromeBookmark[],
  language: string
): Promise<string> => {
  try {
    // Fetch content for relevant bookmarks
    const bookmarkContents = await Promise.all(
      bookmarks.map(async bookmark => ({
        title: bookmark.title,
        url: bookmark.url,
        content: await fetchPageContent(bookmark.url || '')
      }))
    );

    const prompt = `
Query: ${query}

Related Bookmarks:
${bookmarkContents.map(b => `
Title: ${b.title}
URL: ${b.url}
Content: ${b.content}
`).join('\n---\n')}

Based on the provided bookmark contents, please provide a detailed response in ${language} that:
1. Directly answers the query
2. References relevant information from the bookmarks
3. Suggests related topics or resources
4. Maintains a conversational tone
    `.trim();

    const response = await getGeminiResponse({
      prompt,
      type: 'summarize',
      language
    });
    return response.result || 'I apologize, but I could not generate a response based on the available information.';
  } catch (error) {
    console.error('Error generating chat response:', error);
    return 'I apologize, but I encountered an error while processing your request.';
  }
};

export const generateTaskSuggestions = async (content: string): Promise<string> => {
  const response = await getGeminiResponse({
    prompt: `Based on this content, suggest actionable tasks:\n\n${content}`,
    type: 'task',
    language: 'en'
  });
  return response.result || 'Failed to generate task suggestions';
};

export const analyzeProductivity = async (data: any): Promise<string> => {
  const response = await getGeminiResponse({
    prompt: `Analyze this productivity data and provide insights:\n\n${JSON.stringify(data)}`,
    type: 'analytics',
    language: 'en'
  });
  return response.result || 'Failed to analyze productivity';
};

export const suggestTimerDuration = async (task: string): Promise<number> => {
  const response = await getGeminiResponse({
    prompt: `Suggest an optimal duration in minutes for this task:\n\n${task}`,
    type: 'timer',
    language: 'en'
  });
  const minutes = parseInt(response.result);
  return isNaN(minutes) ? 25 : minutes;
};

export const analyzeSentiment = async (content: string): Promise<'positive' | 'negative' | 'neutral'> => {
  const response = await getGeminiResponse({
    prompt: `Analyze the sentiment of this content and respond with exactly one word (positive, negative, or neutral):\n\n${content}`,
    type: 'sentiment',
    language: 'en'
  });
  const sentiment = response.result.toLowerCase().trim();
  return sentiment === 'positive' || sentiment === 'negative' ? sentiment : 'neutral';
};
