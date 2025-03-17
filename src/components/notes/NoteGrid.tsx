
import React from 'react';
import { Note } from '@/types/note';
import NoteCard from './NoteCard';

export interface NoteGridProps {
  notes: Array<Note & { category?: string; sentiment?: 'positive' | 'negative' | 'neutral'; tags?: string[] }>;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => Promise<void>;
  isSelected?: (note: Note) => boolean;
  onSelect?: (note: Note) => void;
  onAnalyze?: (note: Note) => void;
  onConvertToTask?: (note: Note) => void;
  onLinkBookmark?: (note: Note) => void;
}

const NoteGrid: React.FC<NoteGridProps> = ({
  notes,
  onEdit,
  onDelete,
  isSelected = () => false,
  onSelect = () => {},
  onAnalyze = () => {},
  onConvertToTask = () => {},
  onLinkBookmark = () => {}
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
          isSelected={isSelected(note)}
          onSelect={() => onSelect(note)}
          onAnalyze={() => onAnalyze(note)}
          onConvertToTask={() => onConvertToTask(note)}
          onLinkBookmark={() => onLinkBookmark(note)}
        />
      ))}
    </div>
  );
};

export default NoteGrid;
