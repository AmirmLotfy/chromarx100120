import { useEffect, useState } from "react";
import { toast } from "sonner";
import Layout from "../components/Layout";
import { ChromeBookmark } from "@/types/bookmark";
import { suggestBookmarkCategory } from "@/utils/geminiUtils";
import { groupByDomain, extractDomain } from "@/utils/domainUtils";
import BookmarkHeader from "@/components/BookmarkHeader";
import BookmarkControls from "@/components/BookmarkControls";
import BookmarkContent from "@/components/BookmarkContent";
import { useIsMobile } from "@/hooks/use-mobile";

const BookmarksPage = () => {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "dateAdded" | "url">("dateAdded");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"grid" | "list">("list");
  const isMobile = useIsMobile();

  const loadBookmarks = async () => {
    try {
      if (chrome.bookmarks) {
        const results = await chrome.bookmarks.getRecent(100);
        const previousCount = bookmarks.length;
        
        const categorizedResults = await Promise.all(
          results.map(async (bookmark): Promise<ChromeBookmark> => {
            const chromeBookmark: ChromeBookmark = {
              ...bookmark,
              category: undefined
            };
            
            if (!chromeBookmark.category && chromeBookmark.url) {
              chromeBookmark.category = await suggestBookmarkCategory(
                chromeBookmark.title,
                chromeBookmark.url
              );
            }
            return chromeBookmark;
          })
        );
        
        setBookmarks(categorizedResults);

        if (previousCount < categorizedResults.length) {
          const newBookmarks = categorizedResults.slice(0, categorizedResults.length - previousCount);
          notifyNewBookmarks(newBookmarks);
        }
      } else {
        setBookmarks([
          {
            id: "1",
            title: "React Documentation",
            url: "https://react.dev",
            dateAdded: Date.now() - 86400000,
            category: "Development",
          },
          {
            id: "2",
            title: "TypeScript Handbook",
            url: "https://www.typescriptlang.org/docs/",
            dateAdded: Date.now() - 172800000,
            category: "Development",
          },
          {
            id: "3",
            title: "Tailwind CSS",
            url: "https://tailwindcss.com",
            dateAdded: Date.now() - 259200000,
            category: "Design",
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  const notifyNewBookmarks = async (newBookmarks: ChromeBookmark[]) => {
    if (!("Notification" in window)) {
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        newBookmarks.forEach(bookmark => {
          new Notification("New Bookmark Added", {
            body: `${bookmark.title}\n${bookmark.url}`,
            icon: "/icon48.png"
          });

          toast.success(`New bookmark added: ${bookmark.title}`, {
            description: bookmark.url,
          });
        });
      }
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  };

  useEffect(() => {
    loadBookmarks();
    if (chrome.bookmarks) {
      chrome.bookmarks.onCreated.addListener(loadBookmarks);
      return () => {
        chrome.bookmarks.onCreated.removeListener(loadBookmarks);
      };
    }
  }, []);

  const handleDelete = async (id: string) => {
    try {
      if (chrome.bookmarks) {
        await chrome.bookmarks.remove(id);
        setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
        toast.success("Bookmark deleted");
      } else {
        setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
        toast.success("Bookmark deleted (demo mode)");
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      toast.error("Failed to delete bookmark");
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const promises = Array.from(selectedBookmarks).map((id) =>
        chrome.bookmarks ? chrome.bookmarks.remove(id) : Promise.resolve()
      );
      await Promise.all(promises);
      setBookmarks((prev) =>
        prev.filter((bookmark) => !selectedBookmarks.has(bookmark.id))
      );
      setSelectedBookmarks(new Set());
      toast.success(
        `${selectedBookmarks.size} bookmark${
          selectedBookmarks.size === 1 ? "" : "s"
        } deleted`
      );
    } catch (error) {
      console.error("Error deleting bookmarks:", error);
      toast.error("Failed to delete bookmarks");
    }
  };

  const handleUpdateCategories = async (updatedBookmarks: ChromeBookmark[]) => {
    try {
      setBookmarks((prev) => {
        const bookmarkMap = new Map(prev.map(b => [b.id, b]));
        updatedBookmarks.forEach(bookmark => {
          bookmarkMap.set(bookmark.id, bookmark);
        });
        return Array.from(bookmarkMap.values());
      });
      toast.success("Categories updated successfully");
    } catch (error) {
      console.error("Error updating categories:", error);
      toast.error("Failed to update categories");
    }
  };

  const toggleBookmarkSelection = (id: string) => {
    setSelectedBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString();
  };

  const categories = Array.from(
    new Set(bookmarks.map((b) => b.category).filter(Boolean) as string[])
  ).map((name) => ({
    name,
    count: bookmarks.filter((b) => b.category === name).length,
  }));

  const domains = groupByDomain(bookmarks);

  const filteredBookmarks = bookmarks
    .filter((bookmark) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        bookmark.title.toLowerCase().includes(searchLower) ||
        bookmark.url?.toLowerCase().includes(searchLower);
      const matchesCategory =
        !selectedCategory || bookmark.category === selectedCategory;
      const matchesDomain =
        !selectedDomain || 
        (bookmark.url && extractDomain(bookmark.url) === selectedDomain);
      return matchesSearch && matchesCategory && matchesDomain;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "url":
          return (a.url || "").localeCompare(b.url || "");
        case "dateAdded":
          return (b.dateAdded || 0) - (a.dateAdded || 0);
        default:
          return 0;
      }
    });

  const selectedBookmarksArray = Array.from(selectedBookmarks)
    .map(id => bookmarks.find(b => b.id === id))
    .filter((b): b is ChromeBookmark => b !== undefined);

  return (
    <Layout>
      <div className="space-y-8 pb-16">
        <BookmarkHeader
          selectedBookmarksCount={selectedBookmarks.size}
          selectedBookmarks={selectedBookmarksArray}
          view={view}
          onViewChange={setView}
          onDeleteSelected={handleDeleteSelected}
          onUpdateCategories={handleUpdateCategories}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="flex flex-col md:flex-row gap-6">
          <BookmarkControls
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          <BookmarkContent
            categories={categories}
            domains={domains}
            selectedCategory={selectedCategory}
            selectedDomain={selectedDomain}
            onSelectCategory={setSelectedCategory}
            onSelectDomain={setSelectedDomain}
            bookmarks={bookmarks}
            selectedBookmarks={selectedBookmarks}
            onToggleSelect={toggleBookmarkSelection}
            onDelete={handleDelete}
            formatDate={formatDate}
            view={view}
            onReorder={loadBookmarks}
            onBulkDelete={handleDeleteSelected}
            onRefresh={loadBookmarks}
            loading={loading}
            filteredBookmarks={filteredBookmarks}
          />
        </div>
      </div>
    </Layout>
  );
};

export default BookmarksPage;