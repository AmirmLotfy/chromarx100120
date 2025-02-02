import { Note } from "@/types/note";
import NoteCard from "./NoteCard";
import { cn } from "@/lib/utils";

interface NoteGridProps {
  notes: Note[];
  selectedNotes: Set<string>;
  onSelectNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onEditNote: (note: Note) => void;
  onAnalyzeNote: (note: Note) => void;
  onConvertToTask: (note: Note) => void;
  onLinkBookmark: (note: Note) => void;
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
  view = "grid",
}: NoteGridProps) => {
  console.log("NoteGrid rendered with view:", view);

  return (
    <div
      className={cn(
        "p-4",
        view === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "flex flex-col space-y-4"
      )}
    >
      {notes.map((note) => (
        <div
          key={note.id}
          className={cn(
            view === "list" && "w-full"
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
          />
        </div>
      ))}
      {notes.length === 0 && (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          No notes found. Create your first note to get started!
        </div>
      )}
    </div>
  );
};

export default NoteGrid;