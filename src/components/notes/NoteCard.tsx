import { Note } from "@/types/note";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, MessageSquare, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onSelect: (note: Note) => void;
  onDelete: (id: string) => void;
  onEdit: (note: Note) => void;
  onAnalyze: (note: Note) => void;
}

const NoteCard = ({
  note,
  isSelected,
  onSelect,
  onDelete,
  onEdit,
  onAnalyze,
}: NoteCardProps) => {
  const sentimentColor = {
    positive: 'bg-green-500/10 text-green-500',
    negative: 'bg-red-500/10 text-red-500',
    neutral: 'bg-blue-500/10 text-blue-500',
  }[note.sentiment || 'neutral'];

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-lg",
        isSelected ? "ring-2 ring-primary" : ""
      )}
      onClick={() => onSelect(note)}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold line-clamp-1">{note.title}</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
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
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {note.content}
        </p>

        <div className="flex flex-wrap gap-2 mt-2">
          {note.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {note.sentiment && (
            <Badge className={cn("text-xs", sentimentColor)}>
              {note.sentiment}
            </Badge>
          )}
        </div>

        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze(note);
            }}
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            Analyze
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default NoteCard;