
import { ChromeBookmark } from "@/types/bookmark";
import { SearchFilter } from "@/components/SearchBar";
import { extractDomain } from "@/utils/domainUtils";

/**
 * Apply advanced filters to bookmarks
 */
export const applyFilters = (
  bookmarks: ChromeBookmark[],
  searchQuery: string = "",
  filters: SearchFilter = {}
): ChromeBookmark[] => {
  if (!searchQuery && !Object.values(filters).some(Boolean)) {
    return bookmarks;
  }

  return bookmarks.filter(bookmark => {
    // If we don't have a URL, we can't apply most filters
    if (!bookmark.url) {
      return false;
    }

    // Text search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = bookmark.title?.toLowerCase().includes(query);
      const matchesUrl = bookmark.url.toLowerCase().includes(query);

      if (!matchesTitle && !matchesUrl) {
        return false;
      }
    }

    // Category filter
    if (filters.category && bookmark.category !== filters.category) {
      return false;
    }

    // Domain filter
    if (filters.domain) {
      const bookmarkDomain = extractDomain(bookmark.url);
      if (bookmarkDomain !== filters.domain) {
        return false;
      }
    }

    // Tag filter
    if (filters.hasTag) {
      const bookmarkTags = bookmark.tags || [];
      if (!bookmarkTags.includes(filters.hasTag)) {
        return false;
      }
    }

    // Date filter
    if (filters.dateAdded) {
      const filterDate = new Date(filters.dateAdded);
      const bookmarkDate = bookmark.dateAdded ? new Date(bookmark.dateAdded) : null;
      
      if (!bookmarkDate) return false;
      
      // Compare just the date portions
      const filterDateStr = filterDate.toDateString();
      const bookmarkDateStr = bookmarkDate.toDateString();
      
      if (filterDateStr !== bookmarkDateStr) {
        return false;
      }
    }

    // Recent filter (last 7 days)
    if (filters.isRecent) {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const bookmarkDate = bookmark.dateAdded ? new Date(bookmark.dateAdded) : null;
      
      if (!bookmarkDate || bookmarkDate < sevenDaysAgo) {
        return false;
      }
    }

    // Starred filter (assuming a .starred property, which might need to be added)
    if (filters.isStarred && !bookmark.starred) {
      return false;
    }

    return true;
  });
};

export const extractUniqueCategories = (bookmarks: ChromeBookmark[]): string[] => {
  const categorySet = new Set<string>();
  
  bookmarks.forEach(bookmark => {
    if (bookmark.category) {
      categorySet.add(bookmark.category);
    }
  });
  
  return Array.from(categorySet);
};

export const extractUniqueDomains = (bookmarks: ChromeBookmark[]): string[] => {
  const domainSet = new Set<string>();
  
  bookmarks.forEach(bookmark => {
    if (bookmark.url) {
      const domain = extractDomain(bookmark.url);
      if (domain) domainSet.add(domain);
    }
  });
  
  return Array.from(domainSet);
};

export const extractUniqueTags = (bookmarks: ChromeBookmark[]): string[] => {
  const tagSet = new Set<string>();
  
  bookmarks.forEach(bookmark => {
    if (bookmark.tags && Array.isArray(bookmark.tags)) {
      bookmark.tags.forEach(tag => tagSet.add(tag));
    }
  });
  
  return Array.from(tagSet);
};
