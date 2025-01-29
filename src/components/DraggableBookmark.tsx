import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChromeBookmark } from "@/types/bookmark";
import { cn } from "@/lib/utils";
import { Move, Trash2 } from "lucide-react";
import BookmarkContentDisplay from "./BookmarkContentDisplay";
import BookmarkShare from "./BookmarkShare";
import { Checkbox } from "./ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface DraggableBookmarkProps {
  bookmark: ChromeBookmark;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
}

const DraggableBookmark = ({
  bookmark,
  selected,
  onToggleSelect,
  onDelete,
  formatDate,
}: DraggableBookmarkProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: bookmark.id });
  
  const isMobile = useIsMobile();
  const [isLongPressed, setIsLongPressed] = useState(false);
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      setIsLongPressed(true);
      onToggleSelect(bookmark.id);
    }, 500);

    return () => clearTimeout(timer);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col p-3 sm:p-4 rounded-lg group animate-fade-in transition-colors relative touch-manipulation",
        selected ? "bg-primary/10" : "bg-accent hover:bg-accent/80"
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={() => setIsLongPressed(false)}
    >
      <div className="absolute top-2 left-2">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(bookmark.id)}
          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />
      </div>
      <div className="flex items-center gap-2 mb-2 ml-8">
        {!isMobile && (
          <button
            className="p-2 text-muted-foreground hover:text-primary transition-colors cursor-move touch-none"
            {...attributes}
            {...listeners}
          >
            <Move className="h-4 w-4" />
          </button>
        )}
        <BookmarkContentDisplay title={bookmark.title} url={bookmark.url} />
        <BookmarkShare bookmark={bookmark} />
      </div>
      {bookmark.dateAdded && (
        <p className="text-xs text-muted-foreground ml-8">
          Added: {formatDate(bookmark.dateAdded)}
        </p>
      )}
      <button
        onClick={() => onDelete(bookmark.id)}
        className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-destructive transition-colors"
        aria-label="Delete bookmark"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

export default DraggableBookmark;