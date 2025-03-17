
import { Note } from "@/types/note";

export interface NoteActionsProps {
  note: Note;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}
