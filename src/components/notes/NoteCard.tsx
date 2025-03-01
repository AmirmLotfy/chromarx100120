
import { Note } from "@/types/note";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import NoteActions from "./NoteActions";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  const sentimentColors = {
    positive: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300",
    negative: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300",
    neutral: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
  };

  const sentimentColor = note.sentiment ? sentimentColors[note.sentiment] : "";
  const formattedDate = note.updatedAt ? format(new Date(note.updatedAt), "MMM d, yyyy") : "";

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all border-input/40 shadow-sm hover:shadow-md",
        isSelected ? "ring-2 ring-primary" : ""
      )}
      onClick={() => onSelect(note)}
    >
      <div className="relative">
        {/* Color indicator based on sentiment */}
        {note.sentiment && (
          <div className={cn("absolute top-0 right-0 h-2 w-1/4 rounded-bl", sentimentColor)} />
        )}

        <div className="px-4 pt-4 pb-1 flex items-start justify-between">
          <h3 className="font-medium text-base line-clamp-1 pr-6">{note.title}</h3>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(note);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            
            <NoteActions
              note={note}
              onConvertToTask={onConvertToTask}
              onLinkBookmark={onLinkBookmark}
            />
          </div>
        </div>
        
        <CardContent className="px-4 py-2">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{note.content}</p>
          
          <div className="flex items-center justify-between pt-1">
            {note.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {note.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {note.tags.length > 2 && (
                  <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                    +{note.tags.length - 2}
                  </span>
                )}
              </div>
            ) : (
              <div></div>
            )}
            
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default NoteCard;
