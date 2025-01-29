import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Bookmark, ExternalLink, Search, SortAsc, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChromeBookmark {
  id: string;
  title: string;
  url?: string;
  dateAdded?: number;
}

type SortOption = "title" | "dateAdded" | "url";

const BookmarksPage = () => {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("dateAdded");

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        if (chrome.bookmarks) {
          const results = await chrome.bookmarks.getRecent(100);
          setBookmarks(results);
        } else {
          // Demo data for development
          setBookmarks([
            {
              id: "1",
              title: "React Documentation",
              url: "https://react.dev",
              dateAdded: Date.now() - 86400000,
            },
            {
              id: "2",
              title: "TypeScript Handbook",
              url: "https://www.typescriptlang.org/docs/",
              dateAdded: Date.now() - 172800000,
            },
            {
              id: "3",
              title: "Tailwind CSS",
              url: "https://tailwindcss.com",
              dateAdded: Date.now() - 259200000,
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

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString();
  };

  const filteredBookmarks = bookmarks
    .filter((bookmark) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        bookmark.title.toLowerCase().includes(searchLower) ||
        bookmark.url?.toLowerCase().includes(searchLower)
      );
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
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
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

        {loading ? (
          <div className="text-center py-8">Loading bookmarks...</div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No bookmarks found matching your search" : "No bookmarks found"}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="flex items-center justify-between p-4 bg-accent rounded-lg group animate-fade-in"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{bookmark.title}</h3>
                    {bookmark.url && (
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {bookmark.url && (
                    <p className="text-sm text-muted-foreground truncate">
                      {bookmark.url}
                    </p>
                  )}
                  {bookmark.dateAdded && (
                    <p className="text-xs text-muted-foreground">
                      Added: {formatDate(bookmark.dateAdded)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(bookmark.id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Delete bookmark"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BookmarksPage;