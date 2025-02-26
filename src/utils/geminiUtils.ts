import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/chrome-utils";
import { ChromeBookmark } from "@/types/bookmark";
import { fetchPageContent } from "./contentExtractor";
import { aiRequestManager } from "./aiRequestManager";

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
    if (!user) {
      throw new Error("User not authenticated");
    }
    const token = await user.getIdToken();
    const genAI = new GoogleGenerativeAI(token);
    return genAI.getGenerativeModel({ model: "gemini-pro" });
  } catch (error) {
    console.error("Error getting Gemini client:", error);
    throw error;
  }
};

export const getGeminiResponse = async (request: GeminiRequest): Promise<GeminiResponse> => {
  const cacheKey = `gemini_${request.type}_${request.prompt}`;
  
  return aiRequestManager.makeRequest(
    async () => {
      const model = await getGeminiClient();
      const result = await model.generateContent(request.prompt);
      const response = await result.response;
      return { result: response.text() };
    },
    cacheKey,
    { result: getFallbackResponse(request.type, request.language) }
  );
};

const getFallbackResponse = (type: string, language: string): string => {
  switch (type) {
    case 'summarize':
      return 'Unable to generate summary at this time.';
    case 'categorize':
      return 'uncategorized';
    case 'sentiment':
      return 'neutral';
    case 'timer':
      return '25';
    case 'task':
      return 'No task suggestions available.';
    case 'analytics':
      return 'Analytics data unavailable.';
    default:
      return 'Unable to process request.';
  }
};

export const summarizeContent = async (content: string, language: string): Promise<string> => {
  try {
    const response = await getGeminiResponse({
      prompt: `Summarize this content concisely in ${language}, focusing on key points:\n\n${content}`,
      type: 'summarize',
      language
    });
    return response.result || 'Failed to generate summary';
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
};

export const summarizeBookmark = async (bookmark: ChromeBookmark, language: string): Promise<string> => {
  try {
    let content = await fetchPageContent(bookmark.url || '');
    if (!content) {
      content = `Title: ${bookmark.title}\nURL: ${bookmark.url}`;
    }

    const prompt = `
Title: ${bookmark.title}
URL: ${bookmark.url}
Content: ${content}

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
    
    if (!response.result) {
      throw new Error('Failed to generate summary');
    }
    
    return response.result;
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    throw error;
  }
};

export const suggestBookmarkCategory = async (title: string, url: string, content: string, language: string): Promise<string> => {
  try {
    const prompt = `
Based on this content:
Title: ${title}
URL: ${url}
Content: ${content}

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

Respond in ${language} with ONLY the category name, nothing else.
    `.trim();

    const response = await getGeminiResponse({
      prompt,
      type: 'categorize',
      language
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
  const cacheKey = `chat_${query}_${bookmarks.map(b => b.id).join('_')}`;
  
  return aiRequestManager.makeRequest(
    async () => {
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
    },
    cacheKey,
    'I apologize, but I encountered an error while processing your request.'
  );
};

export const generateTaskSuggestions = async (content: string, language: string): Promise<string> => {
  const response = await getGeminiResponse({
    prompt: `Based on this content, suggest actionable tasks in ${language}:\n\n${content}`,
    type: 'task',
    language
  });
  return response.result || 'Failed to generate task suggestions';
};

export const analyzeProductivity = async (data: any, language: string): Promise<string> => {
  const response = await getGeminiResponse({
    prompt: `Analyze this productivity data and provide insights in ${language}:\n\n${JSON.stringify(data)}`,
    type: 'analytics',
    language
  });
  return response.result || 'Failed to analyze productivity';
};

export const suggestTimerDuration = async (task: string, language: string): Promise<number> => {
  const response = await getGeminiResponse({
    prompt: `Suggest an optimal duration in minutes for this task, responding in ${language}:\n\n${task}`,
    type: 'timer',
    language
  });
  const minutes = parseInt(response.result);
  return isNaN(minutes) ? 25 : minutes;
};

export const analyzeSentiment = async (content: string, language: string): Promise<'positive' | 'negative' | 'neutral'> => {
  const response = await getGeminiResponse({
    prompt: `Analyze the sentiment of this content and respond with exactly one word in ${language} (positive, negative, or neutral):\n\n${content}`,
    type: 'sentiment',
    language
  });
  const sentiment = response.result.toLowerCase().trim();
  return sentiment === 'positive' || sentiment === 'negative' ? sentiment : 'neutral';
};
