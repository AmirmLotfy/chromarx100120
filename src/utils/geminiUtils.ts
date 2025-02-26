
import { ChromeBookmark } from "@/types/bookmark";
import { fetchPageContent } from "./contentExtractor";
import { aiRequestManager } from "./aiRequestManager";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

export const getGeminiResponse = async (request: GeminiRequest): Promise<GeminiResponse> => {
  try {
    const result = await callAIFunction(request.type, {
      content: request.prompt,
      language: request.language,
      contentType: request.contentType
    });
    return { result };
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    return { result: '', error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

const callAIFunction = async (operation: string, params: any): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-api', {
      body: { operation, ...params }
    });

    if (error) throw error;
    return data.result;
  } catch (error) {
    console.error('Error calling AI function:', error);
    toast.error("Failed to process AI request");
    throw error;
  }
};

export const summarizeContent = async (content: string, language: string): Promise<string> => {
  return aiRequestManager.makeRequest(
    async () => callAIFunction('summarize', { content, language }),
    `summary_${content.slice(0, 50)}`,
    'Failed to generate summary'
  );
};

export const summarizeBookmark = async (bookmark: ChromeBookmark, language: string): Promise<string> => {
  try {
    let content = await fetchPageContent(bookmark.url || '');
    if (!content) {
      content = `Title: ${bookmark.title}\nURL: ${bookmark.url}`;
    }

    return aiRequestManager.makeRequest(
      async () => callAIFunction('summarize', { 
        content,
        language,
        url: bookmark.url,
        title: bookmark.title 
      }),
      `bookmark_summary_${bookmark.id}`,
      'Failed to generate bookmark summary'
    );
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    throw error;
  }
};

export const suggestBookmarkCategory = async (title: string, url: string, content: string, language: string): Promise<string> => {
  return aiRequestManager.makeRequest(
    async () => callAIFunction('categorize', { title, url, content, language }),
    `category_${url}`,
    'uncategorized'
  );
};

export const generateChatResponse = async (
  query: string,
  bookmarks: ChromeBookmark[],
  language: string
): Promise<string> => {
  const bookmarkContents = await Promise.all(
    bookmarks.map(async bookmark => ({
      title: bookmark.title,
      url: bookmark.url,
      content: await fetchPageContent(bookmark.url || '')
    }))
  );

  const content = `
Query: ${query}

Related Bookmarks:
${bookmarkContents.map(b => `
Title: ${b.title}
URL: ${b.url}
Content: ${b.content}
`).join('\n---\n')}
  `.trim();

  return aiRequestManager.makeRequest(
    async () => callAIFunction('chat', { content, language }),
    `chat_${query}_${bookmarks.map(b => b.id).join('_')}`,
    'Failed to generate chat response'
  );
};

export const generateTaskSuggestions = async (content: string, language: string): Promise<string> => {
  return aiRequestManager.makeRequest(
    async () => callAIFunction('task', { content, language }),
    `task_${content.slice(0, 50)}`,
    'Failed to generate task suggestions'
  );
};

export const analyzeProductivity = async (data: any, language: string): Promise<string> => {
  return aiRequestManager.makeRequest(
    async () => callAIFunction('analytics', { content: JSON.stringify(data), language }),
    `analytics_${Date.now()}`,
    'Failed to analyze productivity'
  );
};

export const suggestTimerDuration = async (task: string, language: string): Promise<number> => {
  const response = await aiRequestManager.makeRequest(
    async () => callAIFunction('suggest-timer', { content: task, language }),
    `timer_${task}`,
    '25'
  );
  const minutes = parseInt(response);
  return isNaN(minutes) ? 25 : minutes;
};

export const analyzeSentiment = async (content: string, language: string): Promise<'positive' | 'negative' | 'neutral'> => {
  const sentiment = await aiRequestManager.makeRequest(
    async () => callAIFunction('sentiment', { content, language }),
    `sentiment_${content.slice(0, 50)}`,
    'neutral'
  );
  return sentiment.toLowerCase().trim() as 'positive' | 'negative' | 'neutral';
};
