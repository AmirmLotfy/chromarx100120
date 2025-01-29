import { useState } from "react";
import { Bookmark, Grid, List, Search, Trash2, Import, Share2, FolderPlus, Sparkles, FileText } from "lucide-react";
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

  const handleGenerateSummaries = async () => {
    if (selectedBookmarks.length === 0) {
      toast.error("Please select bookmarks to summarize");
      return;
    }

    setIsProcessing(true);
    try {
      const summaries = await Promise.all(
        selectedBookmarks.map(async (bookmark) => {
          const summary = await summarizeContent(`${bookmark.title}\n${bookmark.url}`);
          return {
            id: bookmark.id,
            title: bookmark.title,
            content: summary,
            url: bookmark.url || "",
            date: new Date().toLocaleDateString(),
          };
        })
      );

      const existingSummaries = JSON.parse(
        localStorage.getItem("bookmarkSummaries") || "[]"
      );
      localStorage.setItem(
        "bookmarkSummaries",
        JSON.stringify([...summaries, ...existingSummaries])
      );

      toast.success("Summaries generated successfully!");
      navigate("/summaries");
    } catch (error) {
      toast.error("Failed to generate summaries");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestCategories = async () => {
    if (selectedBookmarks.length === 0) {
      toast.error("Please select bookmarks to categorize");
      return;
    }

    setIsProcessing(true);
    try {
      const updatedBookmarks = await Promise.all(
        selectedBookmarks.map(async (bookmark) => ({
          ...bookmark,
          category: await suggestBookmarkCategory(bookmark.title, bookmark.url || ""),
        }))
      );

      onUpdateCategories(updatedBookmarks);
      toast.success("Categories suggested successfully!");
    } catch (error) {
      toast.error("Failed to suggest categories");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCleanup = async () => {
    setIsProcessing(true);
    try {
      const duplicates = findDuplicateBookmarks(selectedBookmarks);
      const brokenBookmarks = await findBrokenBookmarks(selectedBookmarks);
      
      const totalIssues = duplicates.byUrl.length + duplicates.byTitle.length + brokenBookmarks.length;
      
      if (totalIssues === 0) {
        toast.info("No issues found in selected bookmarks");
        return;
      }

      const idsToDelete = [
        ...brokenBookmarks.map(b => b.id),
        ...duplicates.byUrl.flatMap(d => d.bookmarks.slice(1).map(b => b.id)),
      ];

      await onDeleteSelected();
      toast.success(`Cleaned up ${idsToDelete.length} bookmarks`);
    } catch (error) {
      toast.error("Failed to clean up bookmarks");
    } finally {
      setIsProcessing(false);
    }
  };

  const AIActionButtons = () => (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanup}
              disabled={isProcessing || selectedBookmarks.length === 0}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Cleanup
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Find and remove duplicate or broken bookmarks
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSummaries}
              disabled={isProcessing || selectedBookmarks.length === 0}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Summarize
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Generate summaries for selected bookmarks
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSuggestCategories}
              disabled={isProcessing || selectedBookmarks.length === 0}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Categorize
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Suggest categories for selected bookmarks
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <div className="space-y-4 sticky top-0 bg-background/80 backdrop-blur-sm z-20 pb-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Bookmarks</h1>
          {selectedBookmarksCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedBookmarksCount} selected
            </Badge>
          )}
        </div>
        
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <FolderPlus className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="space-y-4">
                <h2 className="font-medium">Actions</h2>
                <AIActionButtons />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <AIActionButtons />
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search bookmarks..."
          className="pl-9 w-full h-9"
          aria-label="Search bookmarks"
        />
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full px-4 py-2 text-left hover:bg-accent first:rounded-t-md last:rounded-b-md"
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
