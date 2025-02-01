import { useState } from "react";
import { Bookmark, Grid, List, Search, Trash2, Import, Share2, FolderPlus, Download, BookmarkPlus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
import SummariesButton from "./summaries/SummariesButton";
import AIActionButtons from "./AIActionButtons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

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
  const [newSummariesCount, setNewSummariesCount] = useState(0);

  return (
    <div className="space-y-4 sticky top-0 bg-background/80 backdrop-blur-sm z-20 pt-4 pb-2 px-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bookmark className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Bookmarks</h1>
          {selectedBookmarksCount > 0 && (
            <Badge variant="secondary" className="ml-1">
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
                  onClick={onCreateFolder}
                  className="h-9 w-9"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create new folder</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onImport}
                  className="h-9 w-9"
                >
                  <Import className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import bookmarks</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onViewChange(view === "grid" ? "list" : "grid")}
                  className="h-9 w-9"
                >
                  {view === "grid" ? (
                    <Grid className="h-4 w-4" />
                  ) : (
                    <List className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle view</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search bookmarks..."
          className="pl-9 pr-4 h-10 text-base bg-muted/50"
        />
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-10">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full px-4 py-2 text-left hover:bg-accent first:rounded-t-lg last:rounded-b-lg text-sm"
                onClick={() => onSelectSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedBookmarksCount > 0 && (
        <div className="flex items-center gap-2 animate-fade-in">
          <AIActionButtons 
            selectedBookmarks={selectedBookmarks}
            onUpdateCategories={onUpdateCategories}
          />
        </div>
      )}
    </div>
  );
};

export default BookmarkHeader;