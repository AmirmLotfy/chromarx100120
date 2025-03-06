
import { toast } from "sonner";

// This is a placeholder for the Google Search API key - you would need to set this up
const GOOGLE_SEARCH_API_KEY = "YOUR_GOOGLE_SEARCH_API_KEY";
const GOOGLE_SEARCH_ENGINE_ID = "YOUR_SEARCH_ENGINE_ID";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export const performGoogleSearch = async (query: string): Promise<SearchResult[]> => {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    return data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet || '',
    }));
  } catch (error) {
    console.error('Error performing Google search:', error);
    toast.error("Failed to search the web. Please try again later.");
    return [];
  }
};

export const processSearchResults = async (results: SearchResult[], query: string): Promise<string> => {
  try {
    // Convert search results to a format suitable for the AI
    const formattedResults = results.map((result, index) => 
      `[${index + 1}] ${result.title}\nURL: ${result.link}\nSummary: ${result.snippet}\n`
    ).join('\n');
    
    // Here you would typically send this to your AI for processing
    // For now, we'll return a formatted version of the results
    return `Search results for "${query}":\n\n${formattedResults}`;
  } catch (error) {
    console.error('Error processing search results:', error);
    return `I found some results for "${query}", but couldn't process them properly.`;
  }
};
