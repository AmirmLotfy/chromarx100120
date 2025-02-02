import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import BookmarkList from "./BookmarkList";
import { ChromeBookmark } from "@/types/bookmark";
import { useIsMobile } from "@/hooks/use-mobile";
import FilterSheet from "./FilterSheet";
import { SortOption } from "@/types/sort";
import { FilterOptions } from "@/types/filter";

interface BookmarkContentProps {
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleBookmark: (id: string) => void;
  onUpdateBookmark: (bookmark: ChromeBookmark) => void;
  view: "grid" | "list";
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  filterOptions: FilterOptions;
  onFilterChange: (options: FilterOptions) => void;
}

const BookmarkContent = ({
  bookmarks,
  selectedBookmarks,
  onToggleBookmark,
  onUpdateBookmark,
  view,
  sortOption,
  onSortChange,
  filterOptions,
  onFilterChange,
}: BookmarkContentProps) => {
  const isMobile = useIsMobile();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="space-y-4">
      {isMobile ? (
        <Sheet>
          <div className="flex gap-2 mb-4">
            <SheetTrigger asChild className="flex-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 hover:from-primary/20 hover:via-primary/30 hover:to-primary/20 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters & Sort
              </Button>
            </SheetTrigger>
          </div>
          <SheetContent side="bottom" className="h-[85%]">
            <FilterSheet
              sortOption={sortOption}
              onSortChange={onSortChange}
              filterOptions={filterOptions}
              onFilterChange={onFilterChange}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <div className="sticky top-[7.25rem] z-10 bg-background/80 backdrop-blur-sm pb-4">
          <FilterSheet
            sortOption={sortOption}
            onSortChange={onSortChange}
            filterOptions={filterOptions}
            onFilterChange={onFilterChange}
          />
        </div>
      )}

      <BookmarkList
        bookmarks={bookmarks}
        selectedBookmarks={selectedBookmarks}
        onToggleBookmark={onToggleBookmark}
        onUpdateBookmark={onUpdateBookmark}
        view={view}
      />
    </div>
  );
};

export default BookmarkContent;