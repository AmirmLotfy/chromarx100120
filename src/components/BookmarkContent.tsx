import { ChromeBookmark } from "@/types/bookmark";
import BookmarkCategories from "./BookmarkCategories";
import BookmarkDomains from "./BookmarkDomains";
import BookmarkList from "./BookmarkList";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Filter } from "lucide-react";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Sort by</Label>
        </div>
        <Select defaultValue="dateAdded">
          <SelectTrigger className="w-full h-8">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dateAdded">Date Added</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="url">URL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Categories</Label>
        <ScrollArea className="h-[180px] rounded-md border bg-background/50 backdrop-blur-sm">
          <div className="p-2">
            <BookmarkCategories
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
            />
          </div>
        </ScrollArea>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Domains</Label>
        <ScrollArea className="h-[180px] rounded-md border bg-background/50 backdrop-blur-sm">
          <div className="p-2">
            <BookmarkDomains
              domains={domains}
              selectedDomain={selectedDomain}
              onSelectDomain={onSelectDomain}
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-full">
      <div className="flex flex-col md:flex-row gap-4">
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="w-full md:w-auto mb-2">
                <Filter className="h-4 w-4 mr-2" />
                Filters & Sort
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-4">
              <SheetHeader className="mb-4">
                <SheetTitle>Filter Bookmarks</SheetTitle>
              </SheetHeader>
              <FilterPanel />
            </SheetContent>
          </Sheet>
        ) : (
          <div className="hidden md:block w-[300px] bg-background/50 backdrop-blur-sm rounded-lg border p-4 h-fit sticky top-4">
            <FilterPanel />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="min-h-[200px] w-full">
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
      </div>
    </div>
  );
};

export default BookmarkContent;