
import { ChromeBookmark } from "@/types/bookmark";
import { getGeminiResponse } from "./geminiUtils";

// Utility function to find bookmarks by content
export const findBookmarksByContent = async (query: string, bookmarks: ChromeBookmark[] = []): Promise<ChromeBookmark[]> => {
  try {
    // This would typically query the database or use AI to find relevant bookmarks
    // For now we'll return filtered bookmarks based on simple text matching
    return bookmarks.filter(bookmark => {
      const titleMatch = bookmark.title?.toLowerCase().includes(query.toLowerCase());
      const urlMatch = bookmark.url?.toLowerCase().includes(query.toLowerCase());
      const contentMatch = bookmark.content?.toLowerCase().includes(query.toLowerCase());
      const categoryMatch = bookmark.category?.toLowerCase().includes(query.toLowerCase());
      const tagsMatch = bookmark.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      
      return titleMatch || urlMatch || contentMatch || categoryMatch || tagsMatch;
    });
  } catch (error) {
    console.error("Error finding bookmarks by content:", error);
    return [];
  }
};

// Utility function to get a bookmark's full content
export const getBookmarkContent = async (url: string): Promise<string> => {
  try {
    // In a real app, this would fetch the content from the URL
    // For now, we'll return a mock content
    return `This is mock content for the bookmark at ${url}. It would contain the full text extracted from the webpage.`;
  } catch (error) {
    console.error("Error getting bookmark content:", error);
    return "";
  }
};

// Utility function to extract metadata from a bookmark
export const extractBookmarkMetadata = async (bookmark: ChromeBookmark): Promise<any> => {
  try {
    // In a real app, this would analyze the bookmark and extract metadata
    return {
      title: bookmark.title,
      url: bookmark.url,
      readingTime: Math.floor(Math.random() * 10) + 1, // 1-10 minutes
      category: bookmark.url?.includes("tech") ? "Technology" : "General",
      importance: Math.floor(Math.random() * 5) + 1, // 1-5 stars
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error extracting bookmark metadata:", error);
    return {
      title: bookmark.title,
      url: bookmark.url,
      createdAt: new Date().toISOString()
    };
  }
};

// Utility function to merge bookmarks by removing duplicates
export const mergeBookmarks = (bookmarks: ChromeBookmark[]): ChromeBookmark[] => {
  const uniqueUrls = new Set();
  return bookmarks.filter(bookmark => {
    if (!bookmark.url || uniqueUrls.has(bookmark.url)) {
      return false;
    }
    uniqueUrls.add(bookmark.url);
    return true;
  });
};

// Utility function to get recommendations based on bookmarks
export const getBookmarkRecommendations = async (bookmarks: ChromeBookmark[]): Promise<ChromeBookmark[]> => {
  try {
    // In a real app, this would analyze the bookmarks and return recommendations
    // For now, we'll return mock recommendations
    return [
      {
        id: "rec1",
        title: "Recommended Site 1",
        url: "https://recommended1.com",
        parentId: "0",
        dateAdded: Date.now(),
        index: 0
      },
      {
        id: "rec2",
        title: "Recommended Site 2",
        url: "https://recommended2.com",
        parentId: "0",
        dateAdded: Date.now(),
        index: 1
      }
    ];
  } catch (error) {
    console.error("Error getting bookmark recommendations:", error);
    return [];
  }
};
