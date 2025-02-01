import { ChromeBookmark } from "@/types/bookmark";
import BookmarkCategories from "./BookmarkCategories";
import BookmarkDomains from "./BookmarkDomains";
import BookmarkList from "./BookmarkList";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Filter, Search } from "lucide-react";
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
    <div className="space-y-4 w-full max-w-full">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Search Bookmarks</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8" />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <Label className="text-sm font-medium">Categories</Label>
          <ScrollArea className="h-[120px]">
            <BookmarkCategories
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
            />
          </ScrollArea>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <Label className="text-sm font-medium">Domains</Label>
          <ScrollArea className="h-[120px]">
            <BookmarkDomains
              domains={domains}
              selectedDomain={selectedDomain}
              onSelectDomain={onSelectDomain}
            />
          </ScrollArea>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <Label className="text-sm font-medium">Sort By</Label>
          <Select defaultValue="dateAdded">
            <SelectTrigger>
              <SelectValue placeholder="Sort bookmarks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dateAdded">Date Added</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="url">URL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 w-full max-w-full px-4 md:px-6">
      <div className="flex flex-col md:flex-row gap-6">
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="w-full md:w-auto mb-4">
                <Filter className="h-4 w-4 mr-2" />
                Filters & Sort
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[360px] p-6">
              <SheetHeader className="mb-6">
                <SheetTitle>Filter Bookmarks</SheetTitle>
              </SheetHeader>
              <FilterPanel />
            </SheetContent>
          </Sheet>
        ) : (
          <div className="hidden md:block w-[300px] bg-card rounded-lg border p-6 h-fit sticky top-4">
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