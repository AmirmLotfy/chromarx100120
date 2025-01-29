import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, ExternalLink, Trash2 } from "lucide-react";

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  dateAdded: number;
}

const BookmarksList = () => {
  const [bookmarks, setBookmarks] = React.useState<BookmarkItem[]>([]);

  React.useEffect(() => {
    // Placeholder for Chrome bookmarks API integration
    // Will be implemented when extension APIs are available
    const demoBookmarks = [
      {
        id: "1",
        title: "Example Bookmark",
        url: "https://example.com",
        dateAdded: Date.now(),
      },
    ];
    setBookmarks(demoBookmarks);
  }, []);

  const handleDeleteBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
  };

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark) => (
        <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <Bookmark className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-medium line-clamp-1">{bookmark.title}</h3>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    {bookmark.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Added {new Date(bookmark.dateAdded).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteBookmark(bookmark.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Delete bookmark"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
      {bookmarks.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No bookmarks found
        </div>
      )}
    </div>
  );
};

export default BookmarksList;