
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

export async function getBookmarkSummary(content: string, options: SummaryOptions = {}): Promise<string | null> {
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
    
    // Build the prompt based on options
    let prompt = `Summarize the following content concisely`;
    
    if (options.maxWords) {
      prompt += ` in about ${options.maxWords} words`;
    }
    
    if (options.focusKeywords && options.focusKeywords.length > 0) {
      prompt += `, focusing on these keywords: ${options.focusKeywords.join(', ')}`;
    }
    
    if (options.language && options.language !== 'en') {
      prompt += `. Please provide the summary in ${options.language} language`;
    }
    
    prompt += `:\n\n${content}`;
    
    // Generate content
    const result = await model.generateContent(prompt);
    
    return result.response.text();
  } catch (error) {
    console.error('Error generating summary with Gemini:', error);
    toast.error('Failed to generate summary');
    return null;
  }
}

export async function analyzeProductivity(analyticsData: any[], goalsData: any[]): Promise<any> {
  try {
    // First try to use the Supabase edge function
    try {
      const result = await supabase.functions.invoke('analyze-productivity', {
        body: { analyticsData, goalsData, timeframe: '7days' }
      });
      
      if (result.error) {
        throw new Error('Failed to use cloud function, falling back to local analysis');
      }
      
      return result.data;
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
