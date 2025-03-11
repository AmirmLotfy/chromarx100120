
import { toast } from "sonner";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export const performGoogleSearch = async (query: string): Promise<SearchResult[]> => {
  try {
    // This function needs actual API credentials to work
    console.error('Google Search API credentials not configured');
    toast.error("Search API not configured. Please add API credentials.");
    return [];
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
    
    return `Search results for "${query}":\n\n${formattedResults}`;
  } catch (error) {
    console.error('Error processing search results:', error);
    return `I found some results for "${query}", but couldn't process them properly.`;
  }
};
