export const findDuplicateBookmarks = (bookmarks: chrome.bookmarks.BookmarkTreeNode[]) => {
  console.log('Finding duplicate bookmarks among:', bookmarks.length, 'bookmarks');
  
  const urlMap = new Map<string, chrome.bookmarks.BookmarkTreeNode[]>();
  const titleMap = new Map<string, chrome.bookmarks.BookmarkTreeNode[]>();

  bookmarks.forEach((bookmark) => {
    if (bookmark.url) {
      const existing = urlMap.get(bookmark.url) || [];
      urlMap.set(bookmark.url, [...existing, bookmark]);
    }
    const existing = titleMap.get(bookmark.title) || [];
    titleMap.set(bookmark.title, [...existing, bookmark]);
  });

  const duplicates = {
    byUrl: Array.from(urlMap.entries())
      .filter(([_, bookmarks]) => bookmarks.length > 1)
      .map(([url, bookmarks]) => ({ url, bookmarks })),
    byTitle: Array.from(titleMap.entries())
      .filter(([_, bookmarks]) => bookmarks.length > 1)
      .map(([title, bookmarks]) => ({ title, bookmarks })),
  };

  console.log('Found duplicates:', {
    byUrl: duplicates.byUrl.length,
    byTitle: duplicates.byTitle.length
  });

  return duplicates;
};

export const checkBrokenBookmark = async (url: string): Promise<boolean> => {
  console.log('Checking if bookmark is broken:', url);
  try {
    // Use HEAD request with no-cors mode first
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      credentials: 'omit',
      redirect: 'follow',
    });

    // If HEAD request succeeds, the bookmark is valid
    if (response.type === 'opaque' || response.status === 200) {
      console.log('Bookmark is valid:', url);
      return true;
    }

    // If HEAD fails, try a GET request as fallback
    const getResponse = await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache',
      credentials: 'omit',
      redirect: 'follow',
    });

    const isWorking = getResponse.type === 'opaque' || getResponse.status === 200;
    console.log('Bookmark status:', isWorking ? 'working' : 'broken');
    return isWorking;
  } catch (error) {
    console.error('Error checking bookmark:', url, error);
    // Consider the bookmark as working if we can't verify it
    // This prevents false positives due to CORS restrictions
    return true;
  }
};

export const findBrokenBookmarks = async (
  bookmarks: chrome.bookmarks.BookmarkTreeNode[]
): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
  console.log('Finding broken bookmarks among:', bookmarks.length, 'bookmarks');
  const brokenBookmarks: chrome.bookmarks.BookmarkTreeNode[] = [];

  for (const bookmark of bookmarks) {
    if (bookmark.url) {
      const isWorking = await checkBrokenBookmark(bookmark.url);
      if (!isWorking) {
        brokenBookmarks.push(bookmark);
      }
    }
  }

  console.log('Found broken bookmarks:', brokenBookmarks.length);
  return brokenBookmarks;
};