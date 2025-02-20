import { toast } from "sonner";

const API_BASE_URL = "https://chromarx.it.com/api";

export const summarizeContent = async (content: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    
    if (!response.ok) {
      throw new Error('Failed to summarize content');
    }
    
    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error("Error summarizing content:", error);
    toast.error("Failed to summarize content");
    return "Unable to generate summary at this time.";
  }
};

export const generateCategories = async (bookmarks: any[]): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bookmarks })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate categories');
    }
    
    const data = await response.json();
    return data.categories;
  } catch (error) {
    console.error("Error generating categories:", error);
    toast.error("Failed to generate categories");
    return [];
  }
};

export const suggestBookmarkCategory = async (title: string, url: string, content: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/suggest-category`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, url, content })
    });
    
    if (!response.ok) {
      throw new Error('Failed to suggest category');
    }
    
    const data = await response.json();
    return data.category;
  } catch (error) {
    console.error("Error suggesting category:", error);
    toast.error("Failed to suggest category");
    return "uncategorized";
  }
};

export const summarizeBookmark = async (bookmark: any): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/summarize-bookmark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bookmark })
    });
    
    if (!response.ok) {
      throw new Error('Failed to summarize bookmark');
    }
    
    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error("Error summarizing bookmark:", error);
    toast.error("Failed to summarize bookmark");
    return "Unable to generate summary.";
  }
};

export const analyzeSentiment = async (content: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze sentiment');
    }
    
    const data = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/gemini-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });
    
    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }
    
    const data = await response.json();
    return { result: data.result };
  } catch (error) {
    console.error("Error getting Gemini response:", error);
    toast.error("Failed to get AI response");
    return { result: "" };
  }
};

export const generateTaskSuggestions = async (taskDetails: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-task-suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ taskDetails })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate suggestions');
    }
    
    const data = await response.json();
    return data.suggestions;
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    toast.error("Failed to generate suggestions");
    return "";
  }
};

export const suggestTimerDuration = async (taskDetails: string): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/suggest-timer-duration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ taskDetails })
    });
    
    if (!response.ok) {
      throw new Error('Failed to suggest duration');
    }
    
    const data = await response.json();
    return data.duration || 25;
  } catch (error) {
    console.error("Error suggesting timer duration:", error);
    toast.error("Failed to suggest duration");
    return 25;
  }
};
