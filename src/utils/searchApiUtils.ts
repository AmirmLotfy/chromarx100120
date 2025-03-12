
import { toast } from "sonner";
import { bookmarkDbService } from "@/services/indexedDbService";
import { ChromeBookmark } from "@/types/bookmark";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

// Enhanced local search with better indexing
export const performLocalSearch = async (query: string): Promise<ChromeBookmark[]> => {
  if (!query.trim()) return [];
  
  try {
    // Get all bookmarks from IndexedDB
    const allBookmarks = await bookmarkDbService.getAll<ChromeBookmark>('bookmarks');
    
    // Split query into words for more targeted search
    const queryWords = query.toLowerCase().trim().split(/\s+/);
    
    // Score each bookmark based on match quality
    const scoredBookmarks = allBookmarks.map(bookmark => {
      let score = 0;
      
      // Basic scoring: title is most important, then url, then category
      for (const word of queryWords) {
        // Title matches (most important)
        if (bookmark.title.toLowerCase().includes(word)) {
          score += 10;
          // Bonus for exact title match
          if (bookmark.title.toLowerCase() === word) {
            score += 15;
          }
          // Bonus for start of title
          if (bookmark.title.toLowerCase().startsWith(word)) {
            score += 5;
          }
        }
        
        // URL matches
        if (bookmark.url?.toLowerCase().includes(word)) {
          score += 8;
          // Bonus for domain match
          if (bookmark.url.toLowerCase().split('/')[2]?.includes(word)) {
            score += 4;
          }
        }
        
        // Category matches
        if (bookmark.category?.toLowerCase().includes(word)) {
          score += 6;
        }
        
        // Content matches (if available)
        if (bookmark.content?.toLowerCase().includes(word)) {
          score += 3;
        }
        
        // Tag matches (if available)
        if (bookmark.tags?.some(tag => tag.toLowerCase().includes(word))) {
          score += 7;
        }
      }
      
      return { bookmark, score };
    });
    
    // Filter out zero scores and sort by score (descending)
    const filteredAndSorted = scoredBookmarks
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
    
    // Return just the bookmarks
    return filteredAndSorted.map(item => item.bookmark);
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
