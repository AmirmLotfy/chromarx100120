import { ChromeBookmark } from "@/types/bookmark";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { ExternalLink, Trash2, Share2, CheckSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useLongPress } from "use-long-press";
import { useState } from "react";
import { toast } from "sonner";

interface DraggableBookmarkProps {
  bookmark: ChromeBookmark;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  view: "grid" | "list";
}

const DraggableBookmark = ({
  bookmark,
  selected,
  onToggleSelect,
  onDelete,
  formatDate,
  view,
}: DraggableBookmarkProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const bind = useLongPress(() => {
    onToggleSelect(bookmark.id);
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  }, {
    onStart: () => setIsPressed(true),
    onFinish: () => setIsPressed(false),
    onCancel: () => setIsPressed(false),
    threshold: 500,
    captureEvent: true,
    cancelOnMovement: true,
  });

  const handleShare = async () => {
    try {
      if (!bookmark.url) {
        throw new Error("No URL to share");
      }

      if (navigator.share) {
        await navigator.share({
          title: bookmark.title,
          text: `Check out this bookmark: ${bookmark.title}`,
          url: bookmark.url,
        });
        toast.success("Bookmark shared successfully!");
      } else {
        await navigator.clipboard.writeText(bookmark.url);
        toast.success("Bookmark URL copied to clipboard!");
      }
    } catch (error) {
      toast.error("Failed to share bookmark");
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      onToggleSelect(bookmark.id);
    } else {
      onToggleSelect(bookmark.id);
    }
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md active:scale-[0.98] touch-manipulation w-full relative select-none cursor-pointer px-0",
        selected && "ring-2 ring-primary bg-accent/50",
        isPressed && "scale-[0.98]",
        view === "list" && "flex items-center"
      )}
      {...bind()}
      onClick={handleClick}
      title="Click to select. Use Ctrl/Cmd + Click for multi-select"
    >
      {selected && (
        <div className="absolute top-2 left-2 text-primary animate-scale-in">
          <CheckSquare className="h-5 w-5" />
        </div>
      )}
      <CardContent
        className={cn(
          "p-4 w-full",
          view === "list" && "flex-1 flex items-center justify-between gap-4",
          selected && "pl-9"
        )}
      >
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="font-medium line-clamp-1 text-base sm:text-lg break-words">
                {bookmark.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1 break-words">
                {bookmark.url}
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {bookmark.category && (
              <Badge variant="secondary" className="text-xs">
                {bookmark.category}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(bookmark.dateAdded)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              window.open(bookmark.url, "_blank");
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(bookmark.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DraggableBookmark;