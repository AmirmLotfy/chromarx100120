import { useState } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import BookmarkCategories from "./BookmarkCategories";
import BookmarkDomains from "./BookmarkDomains";
import BookmarkList from "./BookmarkList";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Filter, RefreshCw, Trash2, Share2, Archive } from "lucide-react";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";

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
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedBookmarks.size === 0) {
      toast.error("Please select bookmarks to delete");
      return;
    }

    try {
      setIsDeleting(true);
      await onBulkDelete(Array.from(selectedBookmarks));
      toast.success(`${selectedBookmarks.size} bookmarks deleted`);
    } catch (error) {
      toast.error("Failed to delete bookmarks");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkShare = async () => {
    if (selectedBookmarks.size === 0) {
      toast.error("Please select bookmarks to share");
      return;
    }

    try {
      const selectedBookmarksList = Array.from(selectedBookmarks)
        .map(id => bookmarks.find(b => b.id === id))
        .filter((b): b is ChromeBookmark => b !== undefined);

      const text = selectedBookmarksList
        .map(b => `${b.title}: ${b.url}`)
        .join('\n');

      if (navigator.share) {
        await navigator.share({
          title: "Shared Bookmarks",
          text: text
        });
        toast.success("Bookmarks shared successfully!");
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Bookmarks copied to clipboard!");
      }
    } catch (error) {
      toast.error("Failed to share bookmarks");
    }
  };

  const handleExport = () => {
    if (selectedBookmarks.size === 0) {
      toast.error("Please select bookmarks to export");
      return;
    }

    const selectedBookmarksList = Array.from(selectedBookmarks)
      .map(id => bookmarks.find(b => b.id === id))
      .filter((b): b is ChromeBookmark => b !== undefined);

    const exportData = JSON.stringify(selectedBookmarksList, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookmarks-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Bookmarks exported successfully!");
  };

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
          <div className="grid grid-cols-2 gap-2 w-full">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-accent to-muted hover:from-accent/90 hover:to-muted/90 transition-all duration-300 shadow-sm"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-4">
                <SheetHeader className="mb-4">
                  <SheetTitle>Filter Bookmarks</SheetTitle>
                </SheetHeader>
                <FilterPanel />
              </SheetContent>
            </Sheet>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 transition-all duration-300 shadow-sm"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        ) : (
          <div className="hidden md:block w-[300px] bg-background/50 backdrop-blur-sm rounded-lg border p-4 h-fit sticky top-4">
            <FilterPanel />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {selectedBookmarks.size > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-destructive/90 hover:bg-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedBookmarks.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkShare}
                className="bg-accent/50 hover:bg-accent transition-colors"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="bg-accent/50 hover:bg-accent transition-colors"
              >
                <Archive className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          )}

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