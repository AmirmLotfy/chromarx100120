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
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      credentials: 'omit',
      redirect: 'follow',
    });
    const isWorking = response.status === 200;
    console.log('Bookmark status:', isWorking ? 'working' : 'broken');
    return isWorking;
  } catch (error) {
    console.error('Error checking bookmark:', url, error);
    return false;
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