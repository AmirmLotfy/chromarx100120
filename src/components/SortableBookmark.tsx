
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChromeBookmark } from "@/types/bookmark";
import DraggableBookmark from "./DraggableBookmark";
import React, { ReactNode } from "react";

interface SortableBookmarkProps {
  bookmark: ChromeBookmark;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  formatDate: (timestamp?: number) => string;
  view: "grid" | "list";
  domain?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  controls?: ReactNode;
  shareComponent?: ReactNode;
  aiActions?: ReactNode;
  tabIndex?: number;
  onFocus?: () => void;
}

const SortableBookmark = ({
  bookmark,
  isSelected,
  onToggleSelect,
  onDelete,
  formatDate,
  view,
  domain,
  isExpanded,
  onToggleExpand,
  controls,
  shareComponent,
  aiActions,
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
        selected={isSelected}
        onToggleSelect={onToggleSelect}
        onDelete={onDelete}
        formatDate={formatDate}
        view={view}
      />
      {isExpanded && (
        <div className="mt-2 pl-4 border-l-2 border-l-gray-200 dark:border-l-gray-700">
          {controls}
          {shareComponent}
          {aiActions}
        </div>
      )}
    </div>
  );
};

export default SortableBookmark;
