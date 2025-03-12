import { toast } from "sonner";
import { ChromeBookmark } from "@/types/bookmark";
import { optimizedBookmarkStorage } from "@/services/optimizedBookmarkStorage";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

// Enhanced local search using optimized storage
export const performLocalSearch = async (query: string): Promise<ChromeBookmark[]> => {
  if (!query.trim()) return [];
  
  try {
    return await optimizedBookmarkStorage.searchBookmarks(query);
  } catch (error) {
    console.error('Error performing local search:', error);
    return [];
  }
};

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

// New function to process and format local search results
export const processLocalSearchResults = (bookmarks: ChromeBookmark[], query: string): string => {
  try {
    if (bookmarks.length === 0) {
      return `No bookmarks found matching "${query}".`;
    }
    
    const formattedResults = bookmarks.map((bookmark, index) => {
      const category = bookmark.category ? `Category: ${bookmark.category}` : '';
      const url = bookmark.url ? `URL: ${bookmark.url}` : '';
      
      return `[${index + 1}] ${bookmark.title}\n${url}\n${category}\n`;
    }).join('\n');
    
    return `Found ${bookmarks.length} bookmarks matching "${query}":\n\n${formattedResults}`;
  } catch (error) {
    console.error('Error processing local search results:', error);
    return `I found some bookmarks for "${query}", but couldn't process them properly.`;
  }
};
