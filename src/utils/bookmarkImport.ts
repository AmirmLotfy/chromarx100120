
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
    // Get the entire bookmark tree
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

        // Skip duplicates
        if (existing.has(node.url)) {
          skipped++;
          return;
        }

        // Create a ChromeBookmark object
        const bookmark: ChromeBookmark = {
          id: node.id,
          title: node.title || "",
          url: node.url,
          dateAdded: node.dateAdded,
          category: parentCategory || undefined
        };

        // Add to the bookmarks list and mark URL as existing
        existing.add(node.url);
        bookmarks.push(bookmark);

        // Log the imported bookmark
        console.log(`Imported bookmark: ${bookmark.title} (${bookmark.url})`);
      }

      // Recursively process children if they exist
      if (node.children) {
        const category = node.title || parentCategory;
        for (const child of node.children) {
          await processNode(child, category);
        }
      }
    };

    // Start processing from root nodes
    for (const root of tree) {
      await processNode(root);
    }

    console.log(`Successfully imported ${bookmarks.length} bookmarks, skipped ${skipped} duplicates`);
    toast.success(`Imported ${bookmarks.length} bookmarks`);
    return { imported: bookmarks, skipped };

  } catch (error) {
    console.error("Error importing bookmarks:", error);
    toast.error("Failed to import bookmarks");
    throw error;
  }
};

export const importFromFile = async (
  file: File,
  onProgress?: (progress: ImportProgress) => void
): Promise<{ imported: ChromeBookmark[]; skipped: number }> => {
  if (!chrome.bookmarks) {
    throw new Error("Chrome bookmarks API not available");
  }

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

          // Skip duplicates
          if (existing.has(url)) {
            skipped++;
            continue;
          }

          // Create Chrome bookmark using the API
          try {
            const bookmark = await chrome.bookmarks.create({
              parentId: '1', // Default to bookmarks bar
              title: link.textContent || url,
              url: url
            });

            const chromeBookmark: ChromeBookmark = {
              id: bookmark.id,
              title: bookmark.title || "",
              url: bookmark.url,
              dateAdded: bookmark.dateAdded,
              category: link.closest('h3')?.textContent || 'Imported'
            };

            existing.add(url);
            bookmarks.push(chromeBookmark);
            console.log(`Created bookmark: ${chromeBookmark.title}`);

          } catch (error) {
            console.error(`Failed to create bookmark for ${url}:`, error);
            continue;
          }
        }

        toast.success(`Successfully imported ${bookmarks.length} bookmarks`);
        resolve({ imported: bookmarks, skipped });
      } catch (error) {
        console.error("Error importing bookmarks from file:", error);
        toast.error("Failed to import bookmarks from file");
        reject(error);
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read bookmark file");
      reject(reader.error);
    };
    
    reader.readAsText(file);
  });
};
