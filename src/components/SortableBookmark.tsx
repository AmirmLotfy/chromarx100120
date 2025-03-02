
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChromeBookmark } from "@/types/bookmark";
import DraggableBookmark from "./DraggableBookmark";

interface SortableBookmarkProps {
  bookmark: ChromeBookmark;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  view: "grid" | "list";
  tabIndex?: number;
  onFocus?: () => void;
}

const SortableBookmark = ({
  bookmark,
  selected,
  onToggleSelect,
  onDelete,
  formatDate,
  view,
  tabIndex,
  onFocus,
}: SortableBookmarkProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none",
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      tabIndex={tabIndex}
      onFocus={onFocus}
    >
      <DraggableBookmark
        bookmark={bookmark}
        selected={selected}
        onToggleSelect={onToggleSelect}
        onDelete={onDelete}
        formatDate={formatDate}
        view={view}
      />
    </div>
  );
};

export default SortableBookmark;
