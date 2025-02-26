
import { useState, useRef } from "react";
import { Bookmark, Grid, List, Search, Trash2, Import, Share2, FolderPlus } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import BookmarkImport from "./BookmarkImport";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2 sticky top-0 bg-background/80 backdrop-blur-sm z-20 pt-4">
      <div className="flex items-center justify-between gap-1.5 flex-wrap px-2">
        <div className="flex items-center gap-1.5">
          <Bookmark className="h-4 w-4 text-primary" />
          <h1 className="text-base font-semibold">Bookmarks</h1>
          {selectedBookmarksCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedBookmarksCount} selected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <SummariesButton newSummariesCount={newSummariesCount} />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <BookmarkImport />
              </TooltipTrigger>
              <TooltipContent>Import bookmarks</TooltipContent>
            </Tooltip>

            {selectedBookmarksCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onDeleteSelected}
                    className="h-7 w-7"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete selected bookmarks</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>

          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-7 w-7">
                  <FolderPlus className="h-3.5 w-3.5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="space-y-4">
                  <h2 className="font-medium">Actions</h2>
                  <div className="grid grid-cols-1 gap-2">
                    {/* Actions content */}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="flex items-center gap-1">
              {/* Desktop actions */}
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-2 px-2">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search bookmarks..."
          className="pl-8 w-full h-8 text-sm"
          aria-label="Search bookmarks"
        />
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10">
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
