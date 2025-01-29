import { ChromeBookmark } from "@/types/bookmark";
import BookmarkCategories from "./BookmarkCategories";
import BookmarkDomains from "./BookmarkDomains";
import BookmarkCleanup from "./BookmarkCleanup";
import BookmarkList from "./BookmarkList";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { SlidersHorizontal } from "lucide-react";

interface BookmarkContentProps {
  categories: { name: string; count: number }[];
  domains: { domain: string; count: number }[];
  selectedCategory: string | null;
  selectedDomain: string | null;
  onSelectCategory: (category: string | null) => void;
  onSelectDomain: (domain: string | null) => void;
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  view: "grid" | "list";
  onReorder: (bookmarks: ChromeBookmark[]) => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onRefresh: () => void;
  loading: boolean;
  filteredBookmarks: ChromeBookmark[];
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
}

const BookmarkContent = ({
  categories,
  domains,
  selectedCategory,
  selectedDomain,
  onSelectCategory,
  onSelectDomain,
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
  view,
  onReorder,
  onBulkDelete,
  onRefresh,
  loading,
  filteredBookmarks,
  onUpdateCategories,
}: BookmarkContentProps) => {
  const isMobile = useIsMobile();

  const FilterPanel = () => (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      <div className="space-y-1.5">
        <h2 className="text-sm font-medium px-2">Categories</h2>
        <BookmarkCategories
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-sm font-medium px-2">Domains</h2>
        <BookmarkDomains
          domains={domains}
          selectedDomain={selectedDomain}
          onSelectDomain={onSelectDomain}
        />
      </div>
      <div className="px-2">
        <BookmarkCleanup
          bookmarks={bookmarks}
          onDelete={onBulkDelete}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-1 sm:space-y-2 w-full max-w-full">
      <div className="flex flex-row gap-1 sm:gap-1.5 items-center justify-between">
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters & Tools
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-[280px] sm:w-[320px] p-3 overflow-y-auto"
            >
              <FilterPanel />
            </SheetContent>
          </Sheet>
        ) : (
          <div className="bg-card rounded-lg border p-3 overflow-hidden">
            <FilterPanel />
          </div>
        )}
      </div>

      <div className="min-h-[200px] w-full max-w-full overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Loading bookmarks...
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No bookmarks found
          </div>
        ) : (
          <BookmarkList
            bookmarks={filteredBookmarks}
            selectedBookmarks={selectedBookmarks}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
            formatDate={formatDate}
            view={view}
            onReorder={onReorder}
            onUpdateCategories={onUpdateCategories}
          />
        )}
      </div>
    </div>
  );
};

export default BookmarkContent;
