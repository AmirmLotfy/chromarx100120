import { auth } from "@/lib/chrome-utils";
import { ChromeBookmark } from "@/types/bookmark";

interface GeminiRequest {
  prompt: string;
  type: 'summarize' | 'categorize' | 'timer' | 'sentiment';
  language: string;
  contentType?: string;
}

interface GeminiResponse {
  result: string;
}

export const getGeminiResponse = async (request: GeminiRequest): Promise<GeminiResponse> => {
  try {
    const user = await auth.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();
    const response = await fetch('YOUR_CLOUD_FUNCTION_URL/getGeminiResponse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to get Gemini response');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    throw error;
  }
};

export const summarizeContent = async (content: string, language: string): Promise<string> => {
  const response = await getGeminiResponse({
    prompt: content,
    type: 'summarize',
    language,
    contentType: 'general'
  });
  return response.result;
};

export const analyzeSentiment = async (content: string, language: string): Promise<string> => {
  const response = await getGeminiResponse({
    prompt: content,
    type: 'sentiment',
    language,
    contentType: 'general'
  });
  return response.result;
};

export const summarizeBookmark = async (bookmark: ChromeBookmark, language: string): Promise<string> => {
  const content = `Title: ${bookmark.title}\nURL: ${bookmark.url}`;
  return await summarizeContent(content, language);
};

export const suggestBookmarkCategory = async (title: string, url: string): Promise<string> => {
  const response = await getGeminiResponse({
    prompt: `Title: ${title}\nURL: ${url}`,
    type: 'categorize',
    language: 'en',
    contentType: 'bookmark'
  });
  return response.result;
};