import { Bookmark, Grid, List, Search, Trash2, Import, Share2, FolderPlus, SlidersHorizontal, Sparkles, Folders } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import BookmarkAIActions from "./BookmarkAIActions";
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
import {
  Card,
  CardContent,
} from "./ui/card";

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

  const AIActionButtons = () => (
    <Card className="bg-accent/50 border-none shadow-none">
      <CardContent className="p-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => {/* Implement cleanup action */}}
        >
          <Trash2 className="h-4 w-4" />
          Cleanup
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => {/* Implement summarize action */}}
        >
          <Sparkles className="h-4 w-4" />
          Summarize
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => {/* Implement categorize action */}}
        >
          <Folders className="h-4 w-4" />
          Categorize
        </Button>
      </CardContent>
    </Card>
  );

  const ActionButtons = () => (
    <div className="flex items-center gap-2">
      <BookmarkAIActions
        selectedBookmarks={selectedBookmarks}
        onUpdateCategories={onUpdateCategories}
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10 sm:h-9 sm:w-9">
            <FolderPlus className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onImport}>
            <Import className="h-4 w-4 mr-2" />
            Import Bookmarks
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCreateFolder}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {!isMobile && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewChange("list")}
            className={cn(
              "h-10 w-10 sm:h-9 sm:w-9",
              view === "list" && "text-primary"
            )}
          >
            <List className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewChange("grid")}
            className={cn(
              "h-10 w-10 sm:h-9 sm:w-9",
              view === "grid" && "text-primary"
            )}
          >
            <Grid className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </>
      )}

      {selectedBookmarksCount > 0 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 sm:h-9 sm:w-9"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "Shared Bookmarks",
                  text: selectedBookmarks.map(b => `${b.title}: ${b.url}`).join("\n"),
                });
              }
            }}
          >
            <Share2 className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={onDeleteSelected}
            className="h-10 w-10 sm:h-9 sm:w-9 animate-fade-in"
          >
            <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </>
      )}
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
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="space-y-4">
                <h2 className="font-medium">Actions</h2>
                <ActionButtons />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <ActionButtons />
        )}
      </div>

      <AIActionButtons />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search bookmarks..."
          className="pl-9 w-full h-10 sm:h-9"
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