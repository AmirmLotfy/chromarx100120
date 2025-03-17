
import { ChromeBookmark } from "@/types/bookmark";
import { getGeminiResponse } from "./geminiUtils";

// Find bookmarks based on their content
export const findBookmarksByContent = async (query: string, bookmarks: ChromeBookmark[]): Promise<ChromeBookmark[]> => {
  try {
    // For now, we'll implement a simple content-based search
    // In a real implementation, this would use more sophisticated matching
    const results = bookmarks.filter(bookmark => {
      // Check if we have a summary in metadata
      const hasSummaryMatch = bookmark.metadata?.summary && 
        bookmark.metadata.summary.toLowerCase().includes(query.toLowerCase());
      
      // Check title and url as fallback
      const hasTitleMatch = bookmark.title.toLowerCase().includes(query.toLowerCase());
      const hasUrlMatch = bookmark.url?.toLowerCase().includes(query.toLowerCase());
      
      return hasSummaryMatch || hasTitleMatch || hasUrlMatch;
    });

    return results;
  } catch (error) {
    console.error("Error searching bookmarks by content:", error);
    return [];
  }
};

// Process bookmarks in batches to avoid performance issues
export const processBatchedBookmarks = async (
  bookmarks: ChromeBookmark[],
  batchSize: number = 10,
  processFunction: (bookmark: ChromeBookmark) => Promise<any>
): Promise<any[]> => {
  const results: any[] = [];
  
  for (let i = 0; i < bookmarks.length; i += batchSize) {
    const batch = bookmarks.slice(i, i + batchSize);
    const batchPromises = batch.map(bookmark => processFunction(bookmark));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

// Generate a bookmark title from URL if no title is provided
export const generateTitleFromUrl = (url: string): string => {
  try {
    // Remove protocol and www
    let title = url.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    // Remove trailing slashes and query params
    title = title.split('/')[0];
    
    // Split by dots and use domain name
    const parts = title.split('.');
    if (parts.length >= 2) {
      // Use the domain name (typically second from last part)
      title = parts[parts.length - 2];
      
      // Capitalize first letter
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }
    
    return title;
  } catch (error) {
    console.error("Error generating title from URL:", error);
    return "Untitled Bookmark";
  }
};

// Check if a URL is valid
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Check for duplicate bookmarks
export const isDuplicateBookmark = (url: string, bookmarks: ChromeBookmark[]): boolean => {
  return bookmarks.some(bookmark => bookmark.url === url);
};

// Extract domain from URL
export const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error("Error extracting domain:", error);
    return "";
  }
};

// Suggest categories for bookmarks
export const suggestCategoryForBookmark = async (bookmark: ChromeBookmark): Promise<string> => {
  try {
    const prompt = `
    Based on the following bookmark information, suggest a single category that best describes it.
    Use one of these categories: Work, Personal, Shopping, Social Media, News, Technology, Education, Entertainment, Finance, Health, Travel, Reference, or Other.
    
    Bookmark Title: ${bookmark.title}
    URL: ${bookmark.url || "N/A"}
    
    Return only the category name, nothing else.
    `;
    
    const response = await getGeminiResponse(prompt);
    return response.trim();
  } catch (error) {
    console.error("Error suggesting category:", error);
    return "Other";
  }
};
