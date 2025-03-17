
import { Note } from "@/types/note";

export interface NoteEditorProps {
  note: Note;
  onSave: (noteData: Omit<Note, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
  defaultCategory?: string;
}
