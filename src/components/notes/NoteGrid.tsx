
import { Note } from "@/types/note";
import NoteCard from "./NoteCard";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  return (
    <div className="w-full pt-2 pb-4">
      <div
        className={cn(
          "grid grid-cols-1 gap-3 md:gap-4 animate-fade-in",
          !isMobile && "sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {notes.map((note) => (
          <div
            key={note.id}
            className="transition-all duration-200 hover:scale-[1.01]"
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
      </div>
      
      {notes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary h-10 w-10"
            >
              <path d="M3 7V5c0-1.1.9-2 2-2h2"></path>
              <path d="M17 3h2c1.1 0 2 .9 2 2v2"></path>
              <path d="M21 17v2c0 1.1-.9 2-2 2h-2"></path>
              <path d="M7 21H5c-1.1 0-2-.9-2-2v-2"></path>
              <path d="M7 7h10"></path>
              <path d="M7 12h10"></path>
              <path d="M7 17h10"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold">No notes yet</h3>
          <p className="text-muted-foreground max-w-md">
            Create your first note by tapping the + button above.
            Your notes will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default NoteGrid;
