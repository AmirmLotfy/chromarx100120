import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Bookmark, Search, SortAsc, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import BookmarkCategories from "@/components/BookmarkCategories";
import BookmarkDomains from "@/components/BookmarkDomains";
import BookmarkList from "@/components/BookmarkList";
import BookmarkCleanup from "@/components/BookmarkCleanup";
import { ChromeBookmark } from "@/types/bookmark";
import { suggestBookmarkCategory } from "@/utils/geminiUtils";
import { groupByDomain, extractDomain } from "@/utils/domainUtils";

const BookmarksPage = () => {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "dateAdded" | "url">("dateAdded");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());

  const loadBookmarks = async () => {
    try {
      if (chrome.bookmarks) {
        const results = await chrome.bookmarks.getRecent(100);
        
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

  useEffect(() => {
    loadBookmarks();
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

  const refreshBookmarks = () => {
    setLoading(true);
    loadBookmarks().finally(() => setLoading(false));
  };

  return (
    <Layout>
      <div className="space-y-6 pb-16">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bookmark className="h-6 w-6" />
              Bookmarks
            </h1>
            <p className="text-muted-foreground">Manage your Chrome bookmarks</p>
          </div>
          {selectedBookmarks.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              className="animate-fade-in"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedBookmarks.size})
            </Button>
          )}
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as "title" | "dateAdded" | "url")}
          >
            <SelectTrigger className="w-[180px]">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dateAdded">Date Added</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="url">URL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <div className="space-y-6">
            <BookmarkCategories
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <BookmarkDomains
              domains={domains}
              selectedDomain={selectedDomain}
              onSelectDomain={setSelectedDomain}
            />
            <BookmarkCleanup
              bookmarks={bookmarks}
              onDelete={handleBulkDelete}
              onRefresh={refreshBookmarks}
            />
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-8">Loading bookmarks...</div>
            ) : filteredBookmarks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? "No bookmarks found matching your search"
                  : "No bookmarks found"}
              </div>
            ) : (
              <BookmarkList
                bookmarks={filteredBookmarks}
                selectedBookmarks={selectedBookmarks}
                onToggleSelect={toggleBookmarkSelection}
                onDelete={handleDelete}
                formatDate={formatDate}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookmarksPage;