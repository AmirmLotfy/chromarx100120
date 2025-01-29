import { ChromeBookmark } from "@/types/bookmark";
import BookmarkCategories from "./BookmarkCategories";
import BookmarkDomains from "./BookmarkDomains";
import BookmarkCleanup from "./BookmarkCleanup";
import BookmarkList from "./BookmarkList";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

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
}: BookmarkContentProps) => {
  const isMobile = useIsMobile();

  const FilterPanel = () => (
    <div>
      <BookmarkCategories
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />
      <BookmarkDomains
        domains={domains}
        selectedDomain={selectedDomain}
        onSelectDomain={onSelectDomain}
      />
      <BookmarkCleanup
        bookmarks={bookmarks}
        onDelete={onBulkDelete}
        onRefresh={onRefresh}
      />
    </div>
  );

  return (
    <div>
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <FilterPanel />
          </SheetContent>
        </Sheet>
      ) : (
        <FilterPanel />
      )}

      <div>
        {loading ? (
          <div>Loading bookmarks...</div>
        ) : filteredBookmarks.length === 0 ? (
          <div>No bookmarks found</div>
        ) : (
          <BookmarkList
            bookmarks={filteredBookmarks}
            selectedBookmarks={selectedBookmarks}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
            formatDate={formatDate}
            view={view}
            onReorder={onReorder}
          />
        )}
      </div>
    </div>
  );
};

export default BookmarkContent;