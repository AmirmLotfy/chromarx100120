
import React, { useState, useRef } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import SortableBookmark from "@/components/SortableBookmark";
import BookmarkControls from "@/components/BookmarkControls";
import BookmarkShare from "@/components/BookmarkShare";
import BookmarkAIActions from "@/components/BookmarkAIActions";
import { extractDomain } from "@/utils/domainUtils";
import { AnimatePresence } from "framer-motion";
import { DndContext, useSensors, useSensor, PointerSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface BookmarkListProps {
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  view: "grid" | "list";
  onReorder?: (bookmarks: ChromeBookmark[]) => void;
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
}

const BookmarkList = ({
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
  view = "list",
  onReorder,
  onUpdateCategories,
}: BookmarkListProps) => {
  const [expandedBookmark, setExpandedBookmark] = useState<string | null>(null);
  const bookmarkListRef = useRef<HTMLDivElement>(null);

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  // Debug logging for visibility issues
  console.log("BookmarkList rendering with:", { 
    bookmarks: bookmarks.length,
    view,
    expandedBookmark
  });
  
  if (bookmarks.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-lg font-medium">No bookmarks found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try changing your search or adding new bookmarks
        </p>
      </div>
    );
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id && onReorder) {
      const oldIndex = bookmarks.findIndex((b) => b.id === active.id);
      const newIndex = bookmarks.findIndex((b) => b.id === over.id);
      
      const newBookmarks = [...bookmarks];
      const [removed] = newBookmarks.splice(oldIndex, 1);
      newBookmarks.splice(newIndex, 0, removed);
      
      onReorder(newBookmarks);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div ref={bookmarkListRef} className="space-y-3">
        <SortableContext items={bookmarks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {bookmarks.map((bookmark) => {
              const isExpanded = expandedBookmark === bookmark.id;
              const isSelected = selectedBookmarks.has(bookmark.id);
              const domain = bookmark.url ? extractDomain(bookmark.url) : "";

              return (
                <SortableBookmark
                  key={bookmark.id}
                  bookmark={bookmark}
                  isSelected={isSelected}
                  onToggleSelect={() => onToggleSelect(bookmark.id)}
                  onDelete={() => onDelete(bookmark.id)}
                  formatDate={formatDate}
                  view={view}
                  domain={domain}
                  isExpanded={isExpanded}
                  onToggleExpand={() => {
                    setExpandedBookmark(isExpanded ? null : bookmark.id);
                  }}
                  controls={
                    <BookmarkControls
                      bookmark={bookmark}
                      onDelete={() => onDelete(bookmark.id)}
                      onUpdateCategories={onUpdateCategories}
                    />
                  }
                  shareComponent={
                    <BookmarkShare bookmark={bookmark} />
                  }
                  aiActions={
                    <BookmarkAIActions
                      bookmark={bookmark}
                      onUpdateBookmark={(updatedBookmark) => {
                        onUpdateCategories([updatedBookmark]);
                      }}
                    />
                  }
                />
              );
            })}
          </AnimatePresence>
        </SortableContext>
      </div>
    </DndContext>
  );
};

export default BookmarkList;
