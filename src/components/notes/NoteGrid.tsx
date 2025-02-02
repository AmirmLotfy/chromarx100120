import { Note } from "@/types/note";
import NoteCard from "./NoteCard";

interface NoteGridProps {
  notes: Note[];
  selectedNotes: Set<string>;
  onSelectNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onEditNote: (note: Note) => void;
  onAnalyzeNote: (note: Note) => void;
}

const NoteGrid = ({
  notes,
  selectedNotes,
  onSelectNote,
  onDeleteNote,
  onEditNote,
  onAnalyzeNote,
}: NoteGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          isSelected={selectedNotes.has(note.id)}
          onSelect={onSelectNote}
          onDelete={onDeleteNote}
          onEdit={onEditNote}
          onAnalyze={onAnalyzeNote}
        />
      ))}
    </div>
  );
};

export default NoteGrid;