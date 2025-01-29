export const findDuplicateBookmarks = (bookmarks: chrome.bookmarks.BookmarkTreeNode[]) => {
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

  return duplicates;
};

export const checkBrokenBookmark = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export const findBrokenBookmarks = async (
  bookmarks: chrome.bookmarks.BookmarkTreeNode[]
): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
  const brokenBookmarks: chrome.bookmarks.BookmarkTreeNode[] = [];

  for (const bookmark of bookmarks) {
    if (bookmark.url) {
      const isWorking = await checkBrokenBookmark(bookmark.url);
      if (!isWorking) {
        brokenBookmarks.push(bookmark);
      }
    }
  }

  return brokenBookmarks;
};