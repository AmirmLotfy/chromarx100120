import { Bookmark, Grid, List, Search, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

interface BookmarkHeaderProps {
  selectedBookmarksCount: number;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  onDeleteSelected: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const BookmarkHeader = ({
  selectedBookmarksCount,
  view,
  onViewChange,
  onDeleteSelected,
  searchQuery,
  onSearchChange,
}: BookmarkHeaderProps) => {
  return (
    <div className="space-y-4 sticky top-0 bg-background/80 backdrop-blur-sm z-20 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Bookmarks</h1>
          {selectedBookmarksCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedBookmarksCount} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewChange("list")}
            className={cn(
              "hidden md:inline-flex",
              view === "list" && "text-primary"
            )}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewChange("grid")}
            className={cn(
              "hidden md:inline-flex",
              view === "grid" && "text-primary"
            )}
          >
            <Grid className="h-4 w-4" />
          </Button>
          {selectedBookmarksCount > 0 && (
            <Button
              variant="destructive"
              size="icon"
              onClick={onDeleteSelected}
              className="animate-fade-in"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search bookmarks..."
          className="pl-9 w-full"
        />
      </div>
    </div>
  );
};

export default BookmarkHeader;