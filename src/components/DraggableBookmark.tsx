import { ChromeBookmark } from "@/types/bookmark";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

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
  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        selected && "ring-2 ring-primary",
        view === "list" && "flex items-center"
      )}
    >
      <CardContent
        className={cn(
          "p-4 cursor-pointer",
          view === "list" && "flex-1 flex items-center justify-between"
        )}
      >
        <div
          className="flex-1"
          onClick={() => onToggleSelect(bookmark.id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1">
              <h3 className="font-medium line-clamp-1">{bookmark.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
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
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(bookmark.url, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(bookmark.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DraggableBookmark;