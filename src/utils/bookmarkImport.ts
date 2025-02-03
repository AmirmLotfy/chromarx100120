import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";

interface ImportProgress {
  total: number;
  current: number;
  skipped: number;
}

export const importBookmarks = async (
  onProgress?: (progress: ImportProgress) => void
): Promise<{ imported: ChromeBookmark[]; skipped: number }> => {
  if (!chrome.bookmarks) {
    throw new Error("Chrome bookmarks API not available");
  }

  try {
    const tree = await chrome.bookmarks.getTree();
    const bookmarks: ChromeBookmark[] = [];
    const existing = new Set<string>();
    let skipped = 0;
    let total = 0;
    let current = 0;

    // First pass to count total bookmarks
    const countBookmarks = (node: chrome.bookmarks.BookmarkTreeNode) => {
      if (node.url) total++;
      if (node.children) {
        node.children.forEach(countBookmarks);
      }
    };
    tree.forEach(countBookmarks);

    // Process bookmarks with progress tracking
    const processNode = async (
      node: chrome.bookmarks.BookmarkTreeNode,
      parentCategory?: string
    ) => {
      if (node.url) {
        current++;
        onProgress?.({ total, current, skipped });

        // Check for duplicates
        if (existing.has(node.url)) {
          skipped++;
          return;
        }

        const bookmark: ChromeBookmark = {
          id: node.id,
          title: node.title,
          url: node.url,
          dateAdded: node.dateAdded,
          category: parentCategory
        };

        existing.add(node.url);
        bookmarks.push(bookmark);
      }

      if (node.children) {
        const category = node.title || parentCategory;
        for (const child of node.children) {
          await processNode(child, category);
        }
      }
    };

    // Start processing from root
    for (const root of tree) {
      await processNode(root);
    }

    console.log(`Imported ${bookmarks.length} bookmarks, skipped ${skipped} duplicates`);
    return { imported: bookmarks, skipped };
  } catch (error) {
    console.error("Error importing bookmarks:", error);
    throw error;
  }
};

export const importFromFile = async (
  file: File,
  onProgress?: (progress: ImportProgress) => void
): Promise<{ imported: ChromeBookmark[]; skipped: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const bookmarks: ChromeBookmark[] = [];
        const existing = new Set<string>();
        let skipped = 0;

        // Process HTML bookmarks file
        const links = doc.getElementsByTagName('a');
        const total = links.length;

        for (let i = 0; i < links.length; i++) {
          const link = links[i];
          const url = link.href;
          
          onProgress?.({
            total,
            current: i + 1,
            skipped
          });

          if (existing.has(url)) {
            skipped++;
            continue;
          }

          const bookmark: ChromeBookmark = {
            id: crypto.randomUUID(),
            title: link.textContent || url,
            url: url,
            dateAdded: Date.now(),
            category: link.closest('h3')?.textContent || 'Imported'
          };

          existing.add(url);
          bookmarks.push(bookmark);
        }

        resolve({ imported: bookmarks, skipped });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};