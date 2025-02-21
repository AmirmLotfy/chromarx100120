
import { toast } from "sonner";

const API_BASE_URL = "https://chromarx.it.com/api";

async function getSupabaseToken(): Promise<string | null> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['supabase_token']);
      return result.supabase_token || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting Supabase token:", error);
    return null;
  }
}

async function makeAuthenticatedRequest(endpoint: string, data: any) {
  const token = await getSupabaseToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return response.json();
}

export const summarizeContent = async (content: string): Promise<string> => {
  try {
    const data = await makeAuthenticatedRequest(`${API_BASE_URL}/summarize`, { content });
    return data.summary;
  } catch (error) {
    console.error("Error summarizing content:", error);
    toast.error("Failed to summarize content");
    return "Unable to generate summary at this time.";
  }
};

export const generateCategories = async (bookmarks: any[]): Promise<string[]> => {
  try {
    const data = await makeAuthenticatedRequest(`${API_BASE_URL}/generate-categories`, { bookmarks });
    return data.categories;
  } catch (error) {
    console.error("Error generating categories:", error);
    toast.error("Failed to generate categories");
    return [];
  }
};

export const suggestBookmarkCategory = async (title: string, url: string, content: string): Promise<string> => {
  try {
    const data = await makeAuthenticatedRequest(`${API_BASE_URL}/suggest-category`, { title, url, content });
    return data.category;
  } catch (error) {
    console.error("Error suggesting category:", error);
    toast.error("Failed to suggest category");
    return "uncategorized";
  }
};

export const analyzeSentiment = async (content: string): Promise<string> => {
  try {
    const data = await makeAuthenticatedRequest(`${API_BASE_URL}/analyze-sentiment`, { content });
    return data.sentiment;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    toast.error("Failed to analyze sentiment");
    return "neutral";
  }
};

export const getGeminiResponse = async (options: { 
  prompt: string;
  type: string;
}): Promise<{ result: string }> => {
  try {
    const data = await makeAuthenticatedRequest(`${API_BASE_URL}/gemini-response`, options);
    return { result: data.result };
  } catch (error) {
    console.error("Error getting Gemini response:", error);
    toast.error("Failed to get AI response");
    return { result: "" };
  }
};

export const generateTaskSuggestions = async (taskDetails: string): Promise<string> => {
  try {
    const data = await makeAuthenticatedRequest(`${API_BASE_URL}/generate-task-suggestions`, { taskDetails });
    return data.suggestions;
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    toast.error("Failed to generate suggestions");
    return "";
  }
};

export const suggestTimerDuration = async (taskDetails: string): Promise<number> => {
  try {
    const data = await makeAuthenticatedRequest(`${API_BASE_URL}/suggest-timer-duration`, { taskDetails });
    return data.duration || 25;
  } catch (error) {
    console.error("Error suggesting timer duration:", error);
    toast.error("Failed to suggest duration");
    return 25;
  }
};
