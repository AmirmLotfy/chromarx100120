import { ChromeBookmark } from "@/types/bookmark";
import BookmarkCategories from "./BookmarkCategories";
import BookmarkDomains from "./BookmarkDomains";
import BookmarkCleanup from "./BookmarkCleanup";
import BookmarkList from "./BookmarkList";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Filter } from "lucide-react";

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
    <div className="space-y-6">
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
    <div className="space-y-6">
      {isMobile ? (
        <div className="flex justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <FilterPanel />
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[250px_1fr]">
          <FilterPanel />
          <div />
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">Loading bookmarks...</div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
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
          />
        )}
      </div>
    </div>
  );
};

export default BookmarkContent;