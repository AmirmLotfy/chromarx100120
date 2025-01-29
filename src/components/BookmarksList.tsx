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
  const [bookmarks, setBookmarks] = React.useState<BookmarkItem[]>([
    {
      id: "1",
      title: "GitHub - Your Development Platform",
      url: "https://github.com",
      dateAdded: Date.now() - 1000000000,
    },
    {
      id: "2",
      title: "Stack Overflow - Developer Community",
      url: "https://stackoverflow.com",
      dateAdded: Date.now() - 2000000000,
    },
    {
      id: "3",
      title: "MDN Web Docs",
      url: "https://developer.mozilla.org",
      dateAdded: Date.now() - 3000000000,
    },
    {
      id: "4",
      title: "React - A JavaScript library for building user interfaces",
      url: "https://reactjs.org",
      dateAdded: Date.now() - 4000000000,
    },
    {
      id: "5",
      title: "TypeScript - JavaScript with syntax for types",
      url: "https://www.typescriptlang.org",
      dateAdded: Date.now() - 5000000000,
    },
    {
      id: "6",
      title: "Tailwind CSS - Rapidly build modern websites",
      url: "https://tailwindcss.com",
      dateAdded: Date.now() - 6000000000,
    },
    {
      id: "7",
      title: "VS Code - Code Editing. Redefined",
      url: "https://code.visualstudio.com",
      dateAdded: Date.now() - 7000000000,
    },
    {
      id: "8",
      title: "Next.js - The React Framework",
      url: "https://nextjs.org",
      dateAdded: Date.now() - 8000000000,
    },
    {
      id: "9",
      title: "Vercel - Develop. Preview. Ship.",
      url: "https://vercel.com",
      dateAdded: Date.now() - 9000000000,
    },
    {
      id: "10",
      title: "Node.js - JavaScript runtime",
      url: "https://nodejs.org",
      dateAdded: Date.now() - 10000000000,
    },
  ]);

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