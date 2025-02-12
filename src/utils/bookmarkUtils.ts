
import { ChromeBookmark } from "@/types/bookmark";
import { chromeDb } from "@/lib/chrome-storage";
import { extractDomain } from "@/utils/domainUtils";
import { fetchPageContent } from "@/utils/contentExtractor";
import { suggestBookmarkCategory } from "@/utils/geminiUtils";

interface BookmarkNode extends chrome.bookmarks.BookmarkTreeNode {
  children?: BookmarkNode[];
  category?: string;
}

export const processBookmarkTree = async (
  node: BookmarkNode,
  parentCategory?: string
): Promise<ChromeBookmark[]> => {
  const bookmarks: ChromeBookmark[] = [];

  // Process current node if it's a bookmark
  if (node.url) {
    const category = await getCategoryForBookmark(node, parentCategory);
    bookmarks.push({
      ...node,
      category
    });
  }

  // Process children recursively
  if (node.children) {
    // If the current node is a folder, use its title as category for children
    const categoryForChildren = node.url ? parentCategory : node.title;
    
    for (const child of node.children) {
      const processedChildren = await processBookmarkTree(child, categoryForChildren);
      bookmarks.push(...processedChildren);
    }
  }

  return bookmarks;
};

export const getCategoryForBookmark = async (
  bookmark: chrome.bookmarks.BookmarkTreeNode,
  parentCategory?: string
): Promise<string> => {
  try {
    // Check cache first
    const cachedCategory = await chromeDb.get<string>(`bookmark-category-${bookmark.id}`);
    if (cachedCategory) return cachedCategory;

    // Use parent folder name as category if available
    if (parentCategory) {
      await chromeDb.set(`bookmark-category-${bookmark.id}`, parentCategory);
      return parentCategory;
    }

    // Auto-categorize based on URL and content
    if (bookmark.url) {
      const content = await fetchPageContent(bookmark.url);
      const suggestedCategory = await suggestBookmarkCategory(
        bookmark.title,
        bookmark.url,
        content
      );

      if (suggestedCategory) {
        await chromeDb.set(`bookmark-category-${bookmark.id}`, suggestedCategory);
        return suggestedCategory;
      }
    }

    return 'Uncategorized';
  } catch (error) {
    console.error('Error getting category for bookmark:', error);
    return 'Uncategorized';
  }
};

export const findDuplicateBookmarks = (bookmarks: ChromeBookmark[]): {
  byUrl: { url: string; bookmarks: ChromeBookmark[] }[];
  byTitle: { title: string; bookmarks: ChromeBookmark[] }[];
} => {
  const urlMap = new Map<string, ChromeBookmark[]>();
  const titleMap = new Map<string, ChromeBookmark[]>();

  bookmarks.forEach(bookmark => {
    if (bookmark.url) {
      const normalizedUrl = normalizeUrl(bookmark.url);
      const existing = urlMap.get(normalizedUrl) || [];
      urlMap.set(normalizedUrl, [...existing, bookmark]);
    }

    const normalizedTitle = bookmark.title.toLowerCase().trim();
    const existing = titleMap.get(normalizedTitle) || [];
    titleMap.set(normalizedTitle, [...existing, bookmark]);
  });

  return {
    byUrl: Array.from(urlMap.entries())
      .filter(([_, bookmarks]) => bookmarks.length > 1)
      .map(([url, bookmarks]) => ({ url, bookmarks })),
    byTitle: Array.from(titleMap.entries())
      .filter(([_, bookmarks]) => bookmarks.length > 1)
      .map(([title, bookmarks]) => ({ title, bookmarks }))
  };
};

const normalizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Remove protocol, www, trailing slashes, and query parameters
    return parsed.hostname.replace(/^www\./, '') + parsed.pathname.replace(/\/$/, '');
  } catch {
    return url;
  }
};
