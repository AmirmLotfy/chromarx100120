import { useState } from "react";
import { Bookmark, Grid, List, Search, Trash2, Import, Share2, FolderPlus, Sparkles, FileText, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { ChromeBookmark } from "@/types/bookmark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "./ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { toast } from "sonner";
import { summarizeContent, suggestBookmarkCategory } from "@/utils/geminiUtils";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { findDuplicateBookmarks, findBrokenBookmarks } from "@/utils/bookmarkCleanup";

interface BookmarkHeaderProps {
  selectedBookmarksCount: number;
  selectedBookmarks: ChromeBookmark[];
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  onDeleteSelected: () => void;
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onImport: () => void;
  onCreateFolder: () => void;
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
}

const BookmarkHeader = ({
  selectedBookmarksCount,
  selectedBookmarks,
  view,
  onViewChange,
  onDeleteSelected,
  onUpdateCategories,
  searchQuery,
  onSearchChange,
  onImport,
  onCreateFolder,
  suggestions,
  onSelectSuggestion,
}: BookmarkHeaderProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImportBookmarks = async () => {
    if (!chrome.bookmarks) {
      toast.error("Chrome bookmarks API not available");
      return;
    }

    try {
      const bookmarks = await chrome.bookmarks.getTree();
      // Process the bookmarks tree
      onImport();
      toast.success("Bookmarks imported successfully!");
    } catch (error) {
      toast.error("Failed to import bookmarks");
    }
  };

  const handleExportBookmarks = async () => {
    if (selectedBookmarks.length === 0) {
      toast.error("Please select bookmarks to export");
      return;
    }

    try {
      const bookmarksData = selectedBookmarks.map(bookmark => ({
        title: bookmark.title,
        url: bookmark.url,
        dateAdded: bookmark.dateAdded,
        category: bookmark.category
      }));

      // Create a Blob with the bookmarks data
      const blob = new Blob([JSON.stringify(bookmarksData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a download link and trigger it
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bookmarks-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Bookmarks exported successfully!");
    } catch (error) {
      toast.error("Failed to export bookmarks");
    }
  };

  return (
    <div className="space-y-2 sticky top-0 bg-background/80 backdrop-blur-sm z-20 pb-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Bookmarks</h1>
          {selectedBookmarksCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedBookmarksCount} selected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleImportBookmarks}
                  className="h-8 w-8"
                >
                  <Import className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import Chrome bookmarks</TooltipContent>
            </Tooltip>

            {selectedBookmarksCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleExportBookmarks}
                    className="h-8 w-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export selected bookmarks</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>

          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="space-y-4">
                  <h2 className="font-medium">Actions</h2>
                  <div className="grid grid-cols-1 gap-2">
                    <AIActionButtons />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="flex items-center gap-2">
              <AIActionButtons />
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search bookmarks..."
          className="pl-9 w-full h-8"
          aria-label="Search bookmarks"
        />
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 mx-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full px-3 py-1.5 text-left hover:bg-accent first:rounded-t-md last:rounded-b-md text-sm"
                onClick={() => onSelectSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkHeader;
