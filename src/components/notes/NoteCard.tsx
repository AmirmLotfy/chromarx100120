import { Note } from "@/types/note";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, BarChart2 } from "lucide-react";
import NoteActions from "./NoteActions";

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onSelect: (note: Note) => void;
  onDelete: (id: string) => void;
  onEdit: (note: Note) => void;
  onAnalyze: (note: Note) => void;
  onConvertToTask: (note: Note) => void;
  onLinkBookmark: (note: Note) => void;
}

const NoteCard = ({
  note,
  isSelected,
  onSelect,
  onDelete,
  onEdit,
  onAnalyze,
  onConvertToTask,
  onLinkBookmark,
}: NoteCardProps) => {
  return (
    <Card
      className={`relative transition-all hover:shadow-lg ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={() => onSelect(note)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="font-semibold">{note.title}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze(note);
            }}
          >
            <BarChart2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <NoteActions
            note={note}
            onConvertToTask={onConvertToTask}
            onLinkBookmark={onLinkBookmark}
          />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NoteCard;