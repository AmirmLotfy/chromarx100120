
import React from 'react';
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';
import { Note } from '@/types/note';
import NoteActions from './NoteActions';

export interface NoteCardProps {
  note: Note & { category?: string; sentiment?: 'positive' | 'negative' | 'neutral' };
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => Promise<void>;
  isSelected?: boolean;
  onSelect?: () => void;
  onAnalyze?: () => void;
  onConvertToTask?: () => void;
  onLinkBookmark?: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect = () => {},
  onAnalyze = () => {},
  onConvertToTask = () => {},
  onLinkBookmark = () => {}
}) => {
  const formattedDate = formatDistanceToNow(
    new Date(typeof note.createdAt === 'string' ? note.createdAt : note.createdAt),
    { addSuffix: true }
  );

  const getNoteColorClass = () => {
    if (note.color) return note.color;
    
    // Default color based on sentiment if available
    if (note.sentiment === 'positive') return 'border-green-200';
    if (note.sentiment === 'negative') return 'border-red-200';
    if (note.sentiment === 'neutral') return 'border-blue-200';
    
    // Default color based on category if available
    if (note.category === 'Work') return 'border-purple-200';
    if (note.category === 'Personal') return 'border-yellow-200';
    if (note.category === 'Ideas') return 'border-cyan-200';
    
    return 'border-gray-200';
  };

  return (
    <Card 
      className={`p-4 h-full flex flex-col border-l-4 ${getNoteColorClass()} ${
        isSelected ? 'ring-2 ring-primary' : ''
      } hover:shadow-md transition-shadow`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-medium truncate">{note.title}</h3>
        <NoteActions 
          note={note} 
          onEdit={() => onEdit(note)} 
          onDelete={() => onDelete(note.id)}
          onAnalyze={onAnalyze}
          onConvertToTask={onConvertToTask}
          onLinkBookmark={onLinkBookmark}
        />
      </div>
      
      {note.category && (
        <div className="mt-1 text-xs text-muted-foreground">{note.category}</div>
      )}
      
      <div className="mt-2 text-sm line-clamp-4 flex-grow">
        {note.content}
      </div>
      
      <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground">
        <span>{formattedDate}</span>
        {note.tags && note.tags.length > 0 && (
          <span>{note.tags.slice(0, 2).join(', ')}</span>
        )}
      </div>
    </Card>
  );
};

export default NoteCard;
