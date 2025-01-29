import { Bookmark, Share2, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ViewToggle from "./ViewToggle";
import { useIsMobile } from "@/hooks/use-mobile";

interface BookmarkHeaderProps {
  selectedBookmarksCount: number;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  onDeleteSelected: () => void;
}

const BookmarkHeader = ({
  selectedBookmarksCount,
  view,
  onViewChange,
  onDeleteSelected,
}: BookmarkHeaderProps) => {
  const isMobile = useIsMobile();

  const ActionButtons = () => (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="h-10 w-10">
        <Upload className="h-5 w-5" />
      </Button>
      <Button variant="outline" size="icon" className="h-10 w-10">
        <Share2 className="h-5 w-5" />
      </Button>
      <ViewToggle view={view} onViewChange={onViewChange} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bookmark className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Bookmarks
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and organize your Chrome bookmarks
          </p>
        </div>
        
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Actions
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[40vh]">
              <SheetHeader>
                <SheetTitle>Bookmark Actions</SheetTitle>
                <SheetDescription>
                  Manage your bookmarks with these actions
                </SheetDescription>
              </SheetHeader>
              <div className="py-6">
                <ActionButtons />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <ActionButtons />
        )}
      </div>

      {selectedBookmarksCount > 0 && (
        <Button
          variant="destructive"
          onClick={onDeleteSelected}
          className="w-full sm:w-auto animate-fade-in"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Selected ({selectedBookmarksCount})
        </Button>
      )}
    </div>
  );
};

export default BookmarkHeader;