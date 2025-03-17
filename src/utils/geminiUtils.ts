
import { v4 as uuidv4 } from 'uuid';
import { Language } from '@/stores/languageStore';
import { ChromeBookmark } from '@/types/bookmark';
import { NoteSentiment } from '@/types/note';
import { localStorageClient as supabase } from '@/lib/local-storage-client';

// Check if Gemini API is available
export const checkGeminiAvailability = async (): Promise<boolean> => {
  try {
    // Call the Supabase function to check API key existence
    const response = await fetch('/api/gemini-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operation: 'check-api-key' }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to check API availability');
    }
    
    const data = await response.json();
    return data.exists === true;
  } catch (error) {
    console.error('Failed to check Gemini availability:', error);
    return false;
  }
};

// Test the reliability of the AI response
export const testAIReliability = async (): Promise<boolean> => {
  try {
    // Test with a simple request
    const response = await fetch('/api/gemini-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        operation: 'categorize',
        content: 'test reliability',
        language: 'en'
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to test AI reliability:', error);
    return false;
  }
};

// Basic function to get responses from Gemini API
export const getGeminiResponse = async (
  promptOrConfig: string | { prompt: string; type: string; language: string; maxRetries: number }
): Promise<string> => {
  try {
    let prompt: string;
    let operation: string = 'chat';
    let language: string = 'en';
    
    if (typeof promptOrConfig === 'string') {
      prompt = promptOrConfig;
    } else {
      prompt = promptOrConfig.prompt;
      operation = promptOrConfig.type || 'chat';
      language = promptOrConfig.language || 'en';
    }
    
    // Call the Supabase function
    const response = await fetch('/api/gemini-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        operation,
        content: prompt,
        language
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.result || 'No response from the AI service.';
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    return 'Sorry, I was unable to process that request.';
  }
};

// Overloaded function for analyzeSentiment to handle all calls from the application
export function analyzeSentiment(text: string): Promise<{ sentiment: string; confidence: number }>;
export function analyzeSentiment(text: string, includeDetails: boolean): Promise<{ sentiment: string; confidence: number; details: string }>;

// Analyze sentiment of text
export async function analyzeSentiment(text: string, includeDetails?: boolean): Promise<any> {
  try {
    // For now, simulate a sentiment analysis result
    const sentiments: NoteSentiment[] = ['positive', 'negative', 'neutral'];
    const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const randomScore = parseFloat(Math.random().toFixed(2));
    
    if (includeDetails) {
      return {
        sentiment: randomSentiment,
        confidence: randomScore,
        details: "Additional sentiment details would be here"
      };
    }
    
    return {
      sentiment: randomSentiment,
      confidence: randomScore
    };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return {
      sentiment: 'neutral',
      confidence: 0.5
    };
  }
}

// Overloaded function signatures for summarizeContent
export function summarizeContent(content: string): Promise<string>;
export function summarizeContent(content: string, language: string, maxLength?: number, format?: string): Promise<string>;

// Summarize content implementation
export async function summarizeContent(content: string, language?: string, maxLength?: number, format?: string): Promise<string> {
  try {
    // For now, return a simple summary based on content length
    if (content.length <= 30) {
      return content;
    }
    
    const summaryLength = maxLength || 200;
    return content.length > summaryLength 
      ? `${content.substring(0, summaryLength)}...` 
      : content;
  } catch (error) {
    console.error('Error summarizing content:', error);
    return content.substring(0, Math.min(100, content.length));
  }
}

// Overloaded function signatures for summarizeBookmark
export function summarizeBookmark(bookmark: ChromeBookmark): Promise<string>;
export function summarizeBookmark(bookmark: ChromeBookmark, language: string): Promise<string>;

// Summarize a bookmark implementation
export async function summarizeBookmark(bookmark: ChromeBookmark, language?: string): Promise<string> {
  try {
    // In a real implementation, this would extract content from the URL
    // For now, we're creating a summary from the bookmark data
    const summary = `Summary of bookmark "${bookmark.title}". This would contain key points extracted from the webpage content.`;
    return summary;
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    return `Summary unavailable for "${bookmark.title}"`;
  }
}

// Overloaded function signatures for suggestBookmarkCategory
export function suggestBookmarkCategory(bookmarkOrTitle: ChromeBookmark | string): Promise<string>;
export function suggestBookmarkCategory(bookmarkOrTitle: ChromeBookmark | string, url?: string, content?: string, language?: string): Promise<string>;

// Suggest a category for a bookmark implementation
export async function suggestBookmarkCategory(
  bookmarkOrTitle: ChromeBookmark | string,
  url?: string,
  content?: string,
  language?: string
): Promise<string> {
  try {
    // Pre-defined categories
    const categories = [
      'Technology', 'News', 'Shopping', 'Social Media', 
      'Entertainment', 'Education', 'Finance', 'Health',
      'Travel', 'Food', 'Sports', 'Reference'
    ];
    
    let title: string;
    let bookmarkUrl: string | undefined;
    
    if (typeof bookmarkOrTitle === 'string') {
      title = bookmarkOrTitle;
      bookmarkUrl = url;
    } else {
      title = bookmarkOrTitle.title;
      bookmarkUrl = bookmarkOrTitle.url;
    }
    
    // In a real implementation, this would use AI to analyze the bookmark
    // For now, assign a semi-random category based on the title
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('tech') || titleLower.includes('code') || titleLower.includes('dev')) {
      return 'Technology';
    } else if (titleLower.includes('news') || titleLower.includes('article')) {
      return 'News';
    } else if (titleLower.includes('shop') || titleLower.includes('buy') || titleLower.includes('store')) {
      return 'Shopping';
    } else if (titleLower.includes('tube') || titleLower.includes('watch') || titleLower.includes('movie')) {
      return 'Entertainment';
    } else {
      // Return a random category as fallback
      return categories[Math.floor(Math.random() * categories.length)];
    }
  } catch (error) {
    console.error('Error suggesting bookmark category:', error);
    return 'Other';
  }
}

// Generate suggestions for tasks
export const generateTaskSuggestions = async (context: string): Promise<any[]> => {
  try {
    // In a real implementation, this would use AI to generate task suggestions
    // For now, we're providing some generic tasks
    const defaultTasks = [
      {
        title: 'Complete project documentation',
        description: 'Update the project documentation with recent changes',
        priority: 'medium',
        category: 'Work'
      },
      {
        title: 'Research new technologies',
        description: 'Spend time researching emerging technologies in your field',
        priority: 'low',
        category: 'Development'
      },
      {
        title: 'Weekly team meeting preparation',
        description: 'Prepare agenda and materials for the upcoming team meeting',
        priority: 'high',
        category: 'Meetings'
      }
    ];
    
    return defaultTasks;
  } catch (error) {
    console.error('Error generating task suggestions:', error);
    return [];
  }
};

// Overloaded function signatures for suggestTimerDuration
export function suggestTimerDuration(context: string): Promise<number>;
export function suggestTimerDuration(context: string, mode: 'focus' | 'break'): Promise<number>;

// Suggest task duration based on context
export async function suggestTimerDuration(context: string, mode: 'focus' | 'break' = 'focus'): Promise<number> {
  try {
    // In a real implementation, this would use AI to suggest a duration
    // For now, we're using some heuristics
    if (mode === 'focus') {
      // Typical pomodoro durations for focus
      return context.includes('deep work') ? 50 : 
             context.includes('quick') ? 15 : 25;
    } else {
      // Break durations
      return context.includes('long break') ? 15 : 5;
    }
  } catch (error) {
    console.error('Error suggesting timer duration:', error);
    return mode === 'focus' ? 25 : 5; // Default pomodoro values
  }
}

// Process productivity insights
export const processProductivityInsights = async (data: any): Promise<any> => {
  try {
    // Simplified insights for now
    return {
      insights: {
        summary: "Based on your activity, you seem to be most productive in the morning.",
        patterns: [
          "High focus sessions between 9-11 AM",
          "Productivity drops after lunch",
          "Mostly working on development tasks"
        ],
        recommendations: [
          "Schedule important tasks in the morning",
          "Take a longer break after lunch",
          "Consider time blocking for different types of work"
        ],
        alerts: [
          "Frequent context switching detected",
          "Long periods without breaks"
        ],
        domainSpecificTips: {
          "example.com": "This site is consuming a lot of your time",
          "social-media.com": "Consider limiting time on social media"
        },
        productivityByDomain: [
          { domain: "work-tool.com", score: 85 },
          { domain: "social-media.com", score: 35 }
        ],
        goalProgress: [
          { category: "Development", current: 10, target: 20 },
          { category: "Reading", current: 5, target: 10 },
          { category: "Exercise", current: 3, target: 7 }
        ]
      }
    };
  } catch (error) {
    console.error('Error processing productivity insights:', error);
    return {
      insights: {
        summary: "Unable to process productivity insights at this time.",
        patterns: [],
        recommendations: ["Try again later"],
        alerts: [],
        domainSpecificTips: {},
        productivityByDomain: [],
        goalProgress: []
      }
    };
  }
};

// Add a utility function for finding bookmarks by content
export const findBookmarksByContent = async (query: string): Promise<any[]> => {
  try {
    // Simulated bookmark search
    return [
      {
        title: "Example Bookmark",
        url: "https://example.com",
        relevance: 0.95
      }
    ];
  } catch (error) {
    console.error('Error finding bookmarks by content:', error);
    return [];
  }
};
