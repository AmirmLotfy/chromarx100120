import { ChromeBookmark } from "@/types/bookmark";
import BookmarkCategories from "./BookmarkCategories";
import BookmarkDomains from "./BookmarkDomains";
import BookmarkCleanup from "./BookmarkCleanup";
import BookmarkList from "./BookmarkList";

interface BookmarkContentProps {
  title?: string;
  url?: string;
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
  return (
    <div className="grid gap-6 md:grid-cols-[250px_1fr]">
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