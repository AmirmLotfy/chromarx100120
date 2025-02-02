import { Note } from "@/types/note";
import NoteCard from "./NoteCard";

interface NoteGridProps {
  notes: Note[];
  selectedNotes: Set<string>;
  onSelectNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onEditNote: (note: Note) => void;
  onAnalyzeNote: (note: Note) => void;
  onConvertToTask: (note: Note) => void;
  onLinkBookmark: (note: Note) => void;
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
}: NoteGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          isSelected={selectedNotes.has(note.id)}
          onSelect={onSelectNote}
          onDelete={onDeleteNote}
          onEdit={onEditNote}
          onAnalyze={onAnalyzeNote}
          onConvertToTask={onConvertToTask}
          onLinkBookmark={onLinkBookmark}
        />
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