export const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
};

export const groupByDomain = (bookmarks: { url?: string }[]) => {
  const groups = new Map<string, number>();
  
  bookmarks.forEach(bookmark => {
    if (bookmark.url) {
      const domain = extractDomain(bookmark.url);
      groups.set(domain, (groups.get(domain) || 0) + 1);
    }
  });
  
  return Array.from(groups.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);
};