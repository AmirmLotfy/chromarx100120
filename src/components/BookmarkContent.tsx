import { ChromeBookmark } from "@/types/bookmark";
import BookmarkCategories from "./BookmarkCategories";
import BookmarkDomains from "./BookmarkDomains";
import BookmarkList from "./BookmarkList";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Filter, SlidersHorizontal, Calendar, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";

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
    <ScrollArea className="h-[calc(100vh-6rem)]">
      <div className="space-y-6 p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">Categories</Label>
            <BookmarkCategories
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-base font-medium">Domains</Label>
            <BookmarkDomains
              domains={domains}
              selectedDomain={selectedDomain}
              onSelectDomain={onSelectDomain}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-base font-medium">Date Added</Label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  return (
    <div className="flex gap-6">
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="mb-4">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0">
            <FilterPanel />
          </SheetContent>
        </Sheet>
      ) : (
        <div className="w-[280px] border-r min-h-[calc(100vh-8rem)] hidden md:block">
          <FilterPanel />
        </div>
      )}

      <div className="flex-1 min-h-[200px] pr-4">
        {loading ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Loading bookmarks...
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground space-y-2">
            <Bookmark className="h-8 w-8" />
            <p>No bookmarks found</p>
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