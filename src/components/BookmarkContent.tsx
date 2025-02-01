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
    <div className="space-y-4 w-full max-w-full">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Search Bookmarks</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8" />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm font-medium">Date Added</Label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent className="bg-background border">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm font-medium">Categories</Label>
          <BookmarkCategories
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm font-medium">Domains</Label>
          <BookmarkDomains
            domains={domains}
            selectedDomain={selectedDomain}
            onSelectDomain={onSelectDomain}
          />
        </div>
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
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-[280px] sm:w-[320px] p-4"
            >
              <SheetHeader className="mb-4">
                <SheetTitle>Filter Bookmarks</SheetTitle>
              </SheetHeader>
              <FilterPanel />
            </SheetContent>
          </Sheet>
        ) : (
          <div className="bg-card rounded-lg border p-4 w-[280px]">
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