import { Bookmark, Share2, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
        <div className="flex items-center gap-2 sm:gap-4">
          {isMobile ? (
            <>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Upload className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Share2 className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10">
                      <Upload className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Import bookmarks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share bookmarks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
          <ViewToggle view={view} onViewChange={onViewChange} />
          {selectedBookmarksCount > 0 && (
            <Button
              variant="destructive"
              onClick={onDeleteSelected}
              className="animate-fade-in"
              size={isMobile ? "sm" : "default"}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isMobile ? selectedBookmarksCount : `Delete Selected (${selectedBookmarksCount})`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarkHeader;