
import { Note, NoteSort } from "@/types/note";
import NoteCard from "./NoteCard";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface NoteGridProps {
  notes: Note[];
  selectedNotes: Set<string>;
  onSelectNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onEditNote: (note: Note) => void;
  onAnalyzeNote: (note: Note) => void;
  onConvertToTask: (note: Note) => void;
  onLinkBookmark: (note: Note) => void;
  onMoveToFolder: (noteId: string, folderId: string) => void;
  sort: NoteSort;
  view?: "grid" | "list";
}

const NoteGrid = ({
  notes,
  selectedNotes,
  onSelectNote,
  onDeleteNote,
  onEditNote,
  onAnalyzeNote,
  onConvertToTask,
  onLinkBookmark,
  onMoveToFolder,
  sort,
  view = "grid",
}: NoteGridProps) => {
  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);

  useEffect(() => {
    // Sort notes based on sort criteria
    const sorted = [...notes].sort((a, b) => {
      switch (sort.field) {
        case 'title':
          return sort.direction === 'asc' 
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        case 'category':
          return sort.direction === 'asc'
            ? a.category.localeCompare(b.category)
            : b.category.localeCompare(a.category);
        case 'createdAt':
          return sort.direction === 'asc'
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updatedAt':
        default:
          return sort.direction === 'asc'
            ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    // Move pinned notes to the top
    const pinned = sorted.filter(note => note.pinned);
    const unpinned = sorted.filter(note => !note.pinned);
    
    setSortedNotes([...pinned, ...unpinned]);
  }, [notes, sort]);

  return (
    <div
      className={cn(
        "p-2 sm:p-4 will-change-transform",
        view === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-4"
          : "flex flex-col space-y-2 sm:space-y-4",
        "motion-reduce:transition-none" // Respect reduced motion preferences
      )}
      style={{
        // Force GPU acceleration for smoother transitions
        transform: "translateZ(0)",
        backfaceVisibility: "hidden"
      }}
    >
      {sortedNotes.map((note) => (
        <div
          key={note.id}
          className={cn(
            "will-change-transform motion-reduce:transition-none",
            view === "list" && "w-full",
            view === "grid" && "h-full"
          )}
        >
          <NoteCard
            note={note}
            isSelected={selectedNotes.has(note.id)}
            onSelect={onSelectNote}
            onDelete={onDeleteNote}
            onEdit={onEditNote}
            onAnalyze={onAnalyzeNote}
            onConvertToTask={onConvertToTask}
            onLinkBookmark={onLinkBookmark}
            onMoveToFolder={onMoveToFolder}
          />
        </div>
      ))}
      {notes.length === 0 && (
        <div className={cn(
          "col-span-full flex items-center justify-center motion-reduce:transition-none",
          view === "grid" ? "min-h-[200px]" : "min-h-[100px]"
        )}>
          <p className="text-sm text-muted-foreground">
            No notes found. Create your first note to get started!
          </p>
        </div>
      )}
    </div>
  );
};

export default NoteGrid;
