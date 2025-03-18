
import { localStorageClient } from '@/lib/chrome-storage-client';
import { geminiService } from '@/services/geminiService';
import { ChromeBookmark } from '@/types/bookmark';

export const getBookmarksByDomain = async (domain: string) => {
  try {
    const result = await localStorageClient
      .from('bookmarks')
      .eq('domain', domain)
      .select()
      .execute();
    
    return result.data || [];
  } catch (error) {
    console.error('Error getting bookmarks by domain:', error);
    return [];
  }
};

export const summarizeBookmark = async (url: string, content: string) => {
  try {
    const bookmarkContent = `URL: ${url}
Content: ${content.substring(0, 1500)}...`;
    
    return await geminiService.summarize(bookmarkContent);
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    return 'Failed to generate summary.';
  }
};

export const categorizeBookmark = async (title: string, description: string) => {
  try {
    const content = `Title: ${title}
Description: ${description || 'No description available'}`;
    
    return await geminiService.categorize(content);
  } catch (error) {
    console.error('Error categorizing bookmark:', error);
    return 'Uncategorized';
  }
};

export const findBookmarksByContent = async (query: string, bookmarks: ChromeBookmark[]): Promise<ChromeBookmark[]> => {
  try {
    // Simple content-based filtering
    return bookmarks.filter(bookmark => {
      if (!bookmark.content) return false;
      
      // Check if the content contains the query (case insensitive)
      return bookmark.content.toLowerCase().includes(query.toLowerCase());
    });
  } catch (error) {
    console.error('Error finding bookmarks by content:', error);
    return [];
  }
};
