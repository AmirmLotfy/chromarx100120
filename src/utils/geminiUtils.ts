
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { storage } from "@/services/storageService";
import { toast } from "sonner";
import { ChromeBookmark } from "@/types/bookmark";
import { localStorageClient as supabase } from "@/lib/local-storage-client";

interface SummaryOptions {
  maxWords?: number;
  focusKeywords?: string[];
  language?: string;
}

// Initialize the API with the API key
const getApiInstance = async () => {
  try {
    // Get API key from local storage
    const apiKey = await storage.get<string>('geminiApiKey');
    
    if (!apiKey) {
      console.error('No Gemini API key found in storage');
      return null;
    }
    
    // Initialize the API
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Error initializing Gemini API:', error);
    return null;
  }
};

export async function checkGeminiAvailability(): Promise<boolean> {
  try {
    const genAI = await getApiInstance();
    return !!genAI;
  } catch (error) {
    console.error('Error checking Gemini availability:', error);
    return false;
  }
}

export async function summarizeContent(content: string, language = 'en'): Promise<string> {
  try {
    const genAI = await getApiInstance();
    if (!genAI) {
      toast.error('Please set your Gemini API key in settings');
      return "API key not set";
    }
    
    // Configure the model
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    
    // Build the prompt
    let prompt = `Summarize the following content concisely`;
    
    if (language && language !== 'en') {
      prompt += `. Please provide the summary in ${language} language`;
    }
    
    prompt += `:\n\n${content}`;
    
    // Generate content
    const result = await model.generateContent(prompt);
    
    return result.response.text();
  } catch (error) {
    console.error('Error generating summary with Gemini:', error);
    toast.error('Failed to generate summary');
    return "Error generating summary";
  }
}

export async function summarizeBookmark(bookmark: ChromeBookmark, language = 'en'): Promise<string> {
  try {
    let content = bookmark.content || "";
    
    if (!content && bookmark.url) {
      // If there's no content but there's a URL, try to use the title and URL as fallback
      content = `Title: ${bookmark.title}\nURL: ${bookmark.url}`;
    }
    
    return summarizeContent(content, language);
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    toast.error('Failed to summarize bookmark');
    return "Error generating summary";
  }
}

export async function suggestBookmarkCategory(title: string, url: string, content: string = "", language = 'en'): Promise<string> {
  try {
    const genAI = await getApiInstance();
    if (!genAI) {
      return "general";
    }
    
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    
    const prompt = `Given this bookmark information, suggest a single category name that best describes it (one word only):
    Title: ${title}
    URL: ${url}
    ${content ? `Content snippet: ${content.substring(0, 500)}...` : ''}
    
    Reply with just the category name in lowercase, for example: "productivity", "development", "news", "shopping", etc.`;
    
    const result = await model.generateContent(prompt);
    const categoryText = result.response.text().trim().toLowerCase();
    
    // Extract just the first word if it returns multiple
    const category = categoryText.split(/[^a-zA-Z0-9-]/)[0];
    
    return category || "general";
  } catch (error) {
    console.error('Error suggesting category:', error);
    return "general";
  }
}

export async function analyzeProductivity(analyticsData: any[], goalsData: any[]): Promise<any> {
  try {
    // First try to use the Supabase edge function
    try {
      const { data } = await supabase.functions.invoke('analyze-productivity', {
        body: { analyticsData, goalsData, timeframe: '7days' }
      });
      
      return data;
    } catch (cloudError) {
      console.warn('Cloud function failed, using local analysis:', cloudError);
      
      // Fallback to local analysis with Gemini (if available)
      const genAI = await getApiInstance();
      if (!genAI) {
        toast.error('Please set your Gemini API key in settings');
        throw new Error('No Gemini API key available for local analysis');
      }
      
      // Configure the model
      const model = genAI.getGenerativeModel({
        model: "gemini-pro",
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });
      
      // Prepare the data for analysis
      const analyticsString = JSON.stringify(analyticsData);
      const goalsString = JSON.stringify(goalsData);
      
      const prompt = `
        Please analyze the following productivity data and goals to provide insights.
        
        Analytics data:
        ${analyticsString}
        
        Goals data:
        ${goalsString}
        
        Please provide a structured JSON response with these fields:
        - summary: A short overview of the user's productivity
        - patterns: An array of identified productivity patterns
        - recommendations: An array of actionable recommendations
        - alerts: An array of any concerning trends that need attention
        - domainSpecificTips: An object with domain names as keys and specific tips as values
        - productivityByDomain: An array of objects with domain and score properties
        - goalProgress: An array of objects with category, current, and target properties
      `;
      
      // Generate insights
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Parse JSON from the response
      const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || text.match(/```\n([\s\S]*)\n```/) || text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Could not parse JSON response from Gemini');
      }
      
      const jsonStr = jsonMatch[0].replace(/```json\n|```\n|```/g, '');
      const insights = JSON.parse(jsonStr);
      
      return { insights };
    }
  } catch (error) {
    console.error('Error analyzing productivity:', error);
    toast.error('Failed to analyze productivity data');
    
    // Return mock insights as fallback
    return {
      insights: {
        summary: "We couldn't analyze your productivity at this time. Please try again later.",
        patterns: ["Not enough data to identify patterns"],
        recommendations: ["Continue tracking your productivity to get personalized recommendations"],
        alerts: [],
        domainSpecificTips: {},
        productivityByDomain: [],
        goalProgress: []
      }
    };
  }
}

export async function suggestBookmarkOrganization(bookmarks: ChromeBookmark[]): Promise<any> {
  try {
    const genAI = await getApiInstance();
    if (!genAI) {
      toast.error('Please set your Gemini API key in settings');
      return null;
    }
    
    // Configure the model
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    
    // Take a subset of bookmarks if there are too many
    const sampleBookmarks = bookmarks.slice(0, 50); // Limit to 50 to avoid token limits
    
    const prompt = `
      Please analyze these bookmarks and suggest ways to organize them into folders/categories:
      
      ${JSON.stringify(sampleBookmarks.map(b => ({ title: b.title, url: b.url })))}
      
      Please provide a structured JSON response with these fields:
      - suggestedCategories: An array of category names that would make sense
      - bookmarkAssignments: An object where keys are bookmark titles and values are the suggested category
      - organizationTips: An array of tips for better bookmark organization
    `;
    
    // Generate insights
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || text.match(/```\n([\s\S]*)\n```/) || text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not parse JSON response from Gemini');
    }
    
    const jsonStr = jsonMatch[0].replace(/```json\n|```\n|```/g, '');
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error suggesting bookmark organization:', error);
    toast.error('Failed to suggest bookmark organization');
    
    return {
      suggestedCategories: ["Work", "Personal", "Research", "Shopping", "News"],
      bookmarkAssignments: {},
      organizationTips: [
        "Group similar bookmarks together",
        "Use descriptive folder names",
        "Consider using tags for cross-categorization",
        "Regularly clean up unused bookmarks"
      ]
    };
  }
}

// Add additional required functions
export async function generateTaskSuggestions(taskInfo: string, language = 'en'): Promise<string> {
  try {
    const genAI = await getApiInstance();
    if (!genAI) {
      return "";
    }
    
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
    });
    
    const prompt = `Based on this task information, provide 3-5 concise suggestions to help complete it effectively:
    ${taskInfo}
    
    Reply with bullet points only.`;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating task suggestions:', error);
    return "";
  }
}

export async function suggestTimerDuration(taskInfo: string, language = 'en'): Promise<number> {
  try {
    const genAI = await getApiInstance();
    if (!genAI) {
      return 25; // Default Pomodoro duration
    }
    
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
    });
    
    const prompt = `Based on this task information, suggest an optimal focus session duration in minutes (between 5 and 120):
    ${taskInfo}
    
    Reply with just the number of minutes.`;
    
    const result = await model.generateContent(prompt);
    const durationText = result.response.text().trim();
    const duration = parseInt(durationText, 10);
    
    if (isNaN(duration) || duration < 5 || duration > 120) {
      return 25; // Default if response is invalid
    }
    
    return duration;
  } catch (error) {
    console.error('Error suggesting timer duration:', error);
    return 25;
  }
}

export async function getGeminiResponse(prompt: string, language = 'en'): Promise<string> {
  try {
    const genAI = await getApiInstance();
    if (!genAI) {
      toast.error('Please set your Gemini API key in settings');
      return "API key not set";
    }
    
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
    });
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    return "Error generating response";
  }
}

export async function analyzeSentiment(text: string): Promise<{sentiment: string, confidence: number}> {
  try {
    const genAI = await getApiInstance();
    if (!genAI) {
      return { sentiment: "neutral", confidence: 0 };
    }
    
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
    });
    
    const prompt = `Analyze the sentiment of this text. Reply with a JSON object containing 'sentiment' (positive, negative, or neutral) and 'confidence' (a number between 0 and 1):
    
    "${text}"`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          sentiment: data.sentiment || "neutral",
          confidence: data.confidence || 0.5
        };
      }
    } catch (parseError) {
      console.error('Error parsing sentiment analysis response:', parseError);
    }
    
    return { sentiment: "neutral", confidence: 0.5 };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return { sentiment: "neutral", confidence: 0 };
  }
}

export async function testAIReliability(): Promise<boolean> {
  try {
    const genAI = await getApiInstance();
    return !!genAI;
  } catch (error) {
    return false;
  }
}
