import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChromeBookmark } from "@/types/bookmark";
import { cn } from "@/lib/utils";
import { Move, Trash2 } from "lucide-react";
import BookmarkContent from "./BookmarkContent";
import BookmarkShare from "./BookmarkShare";
import { Checkbox } from "./ui/checkbox";

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col p-4 rounded-lg group animate-fade-in transition-colors relative",
        selected ? "bg-primary/10" : "bg-accent hover:bg-accent/80"
      )}
    >
      <div className="absolute top-2 left-2">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(bookmark.id)}
          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />
      </div>
      <div className="flex items-center gap-2 mb-2 ml-8">
        <button
          className="p-2 text-muted-foreground hover:text-primary transition-colors cursor-move"
          {...attributes}
          {...listeners}
        >
          <Move className="h-4 w-4" />
        </button>
        <BookmarkContent title={bookmark.title} url={bookmark.url} />
        <BookmarkShare bookmark={bookmark} />
      </div>
      {bookmark.url && (
        <p className="text-sm text-muted-foreground truncate ml-8">
          {bookmark.url}
        </p>
      )}
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