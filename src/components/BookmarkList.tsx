import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { CheckSquare, Filter } from "lucide-react";
import { ChromeBookmark } from "@/types/bookmark";
import BookmarkCard from "./BookmarkCard";
import BookmarkTable from "./BookmarkTable";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import FilterSort from "./FilterSort";
import { SortOption } from "@/types/sort";
import { FilterOptions } from "@/types/filter";

interface BookmarkListProps {
  bookmarks: ChromeBookmark[];
  view: "grid" | "list";
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onUpdateBookmark: (bookmark: ChromeBookmark) => void;
  onDeleteBookmark: (id: string) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  filterOptions: FilterOptions;
  onFilterChange: (options: FilterOptions) => void;
}

const BookmarkList = ({
  bookmarks,
  view,
  selectedBookmarks,
  onToggleSelect,
  onSelectAll,
  onUpdateBookmark,
  onDeleteBookmark,
  sortOption,
  onSortChange,
  filterOptions,
  onFilterChange,
}: BookmarkListProps) => {
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSelectAll = () => {
    onSelectAll();
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          className="flex-1 bg-gradient-to-r from-accent/50 via-accent/70 to-accent/50 hover:from-accent/70 hover:via-accent/90 hover:to-accent/70 transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <CheckSquare className="h-4 w-4 mr-1.5" />
          {selectedBookmarks.size === bookmarks.length ? "Deselect All" : "Select All"}
        </Button>
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 hover:from-primary/20 hover:via-primary/30 hover:to-primary/20 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Filter className="h-4 w-4 mr-1.5" />
                Filters & Sort
              </Button>
            </SheetTrigger>
            <SheetContent>
              <FilterSort
                sortOption={sortOption}
                onSortChange={onSortChange}
                filterOptions={filterOptions}
                onFilterChange={onFilterChange}
              />
            </SheetContent>
          </Sheet>
        ) : (
          <div className="flex-1">
            <FilterSort
              sortOption={sortOption}
              onSortChange={onSortChange}
              filterOptions={filterOptions}
              onFilterChange={onFilterChange}
            />
          </div>
        )}
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              isSelected={selectedBookmarks.has(bookmark.id)}
              onToggleSelect={() => onToggleSelect(bookmark.id)}
              onUpdate={onUpdateBookmark}
              onDelete={() => onDeleteBookmark(bookmark.id)}
            />
          ))}
        </div>
      ) : (
        <BookmarkTable
          bookmarks={bookmarks}
          selectedBookmarks={selectedBookmarks}
          onToggleSelect={onToggleSelect}
          onUpdateBookmark={onUpdateBookmark}
          onDeleteBookmark={onDeleteBookmark}
        />
      )}
    </div>
  );
};

export default BookmarkList;