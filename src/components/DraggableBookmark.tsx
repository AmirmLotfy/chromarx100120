
import { ChromeBookmark } from "@/types/bookmark";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { ExternalLink, Trash2, Share2, CheckSquare, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useLongPress } from "use-long-press";
import { useState } from "react";
import { toast } from "sonner";
import { AspectRatio } from "./ui/aspect-ratio";

interface DraggableBookmarkProps {
  bookmark: ChromeBookmark;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  view: "grid" | "list";
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const DraggableBookmark = ({
  bookmark,
  selected,
  onToggleSelect,
  onDelete,
  formatDate,
  view,
  isExpanded,
  onToggleExpand,
}: DraggableBookmarkProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
          text: bookmark.preview?.description || `Check out this bookmark: ${bookmark.title}`,
          url: bookmark.url,
        });
        toast.success("Bookmark shared successfully!");
      } else {
        await navigator.clipboard.writeText(bookmark.url);
        toast.success("Bookmark URL copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
      toast.error("Failed to share bookmark");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await onDelete(bookmark.id);
      toast.success("Bookmark deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete bookmark");
    } finally {
      setIsLoading(false);
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
        "transition-all duration-200 hover:shadow-md touch-manipulation w-full relative select-none cursor-pointer px-0",
        selected && "bg-accent/50",
        view === "list" && "flex items-center",
        isPressed && "scale-[0.98]"
      )}
      {...bind()}
      onClick={handleClick}
      title="Click to select. Use Ctrl/Cmd + Click for multi-select"
    >
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      
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
              {bookmark.preview?.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {bookmark.preview.description}
                </p>
              )}
              <p className="text-sm text-muted-foreground line-clamp-1 break-words">
                {bookmark.url}
              </p>
            </div>
            {view === "grid" && bookmark.preview?.ogImage && (
              <AspectRatio ratio={16 / 9} className="w-full mt-2">
                <img
                  src={bookmark.preview.ogImage}
                  alt={bookmark.title}
                  className="rounded-lg object-cover w-full h-full"
                  loading="lazy"
                />
              </AspectRatio>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {bookmark.category && (
              <Badge variant="secondary" className="text-xs">
                {bookmark.category}
              </Badge>
            )}
            {bookmark.metadata?.tags?.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            <span className="text-xs text-muted-foreground">
              {formatDate(bookmark.dateAdded)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-accent/50 transition-colors"
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
            className="h-8 w-8 hover:bg-accent/50 transition-colors"
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
            className="h-8 w-8 hover:bg-accent/50 transition-colors"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-accent/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleExpand) onToggleExpand();
              }}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DraggableBookmark;
