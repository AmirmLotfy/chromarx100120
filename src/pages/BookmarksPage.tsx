import { useEffect, useState } from "react";
import { toast } from "sonner";
import Layout from "../components/Layout";
import { ChromeBookmark } from "@/types/bookmark";
import { suggestBookmarkCategory } from "@/utils/geminiUtils";
import { groupByDomain, extractDomain } from "@/utils/domainUtils";
import SearchBar from "@/components/SearchBar";
import BookmarkHeader from "@/components/BookmarkHeader";
import BookmarkControls from "@/components/BookmarkControls";
import BookmarkContent from "@/components/BookmarkContent";

const BookmarksPage = () => {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "dateAdded" | "url">("dateAdded");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"grid" | "list">("list");

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
    if (chrome.bookmarks) {
      chrome.bookmarks.onCreated.addListener(() => {
        loadBookmarks();
      });
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

  const handleBulkDelete = async (ids: string[]) => {
    try {
      if (chrome.bookmarks) {
        const promises = ids.map(id => chrome.bookmarks.remove(id));
        await Promise.all(promises);
        setBookmarks(prev => prev.filter(bookmark => !ids.includes(bookmark.id)));
        toast.success(`${ids.length} bookmarks deleted`);
      }
    } catch (error) {
      console.error("Error deleting bookmarks:", error);
      toast.error("Failed to delete bookmarks");
    }
  };

  const handleReorderBookmarks = async (newBookmarks: ChromeBookmark[]) => {
    try {
      if (chrome.bookmarks) {
        for (let i = 0; i < newBookmarks.length; i++) {
          await chrome.bookmarks.move(newBookmarks[i].id, { index: i });
        }
      }
      setBookmarks(newBookmarks);
      toast.success("Bookmarks reordered successfully");
    } catch (error) {
      console.error("Error reordering bookmarks:", error);
      toast.error("Failed to reorder bookmarks");
    }
  };

  return (
    <Layout>
      <div className="space-y-8 pb-16">
        <BookmarkHeader
          selectedBookmarksCount={selectedBookmarks.size}
          view={view}
          onViewChange={setView}
          onDeleteSelected={handleDeleteSelected}
        />

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          bookmarks={bookmarks}
          onSelectBookmark={(bookmark) => {
            const element = document.getElementById(`bookmark-${bookmark.id}`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              element.classList.add("animate-highlight");
              setTimeout(() => {
                element.classList.remove("animate-highlight");
              }, 2000);
            }
          }}
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
            onReorder={handleReorderBookmarks}
            onBulkDelete={handleBulkDelete}
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
