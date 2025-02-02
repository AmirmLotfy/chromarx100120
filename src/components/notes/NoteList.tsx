import { Note } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Edit2, Tag } from "lucide-react";

interface NoteListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

const NoteList = ({
  notes,
  selectedNote,
  onSelectNote,
  onDeleteNote,
}: NoteListProps) => {
  return (
    <ScrollArea className="h-full px-4">
      <div className="space-y-4">
        {notes.map((note) => (
          <Card
            key={note.id}
            className={`p-4 cursor-pointer transition-all hover:scale-[1.02] ${
              selectedNote?.id === note.id
                ? "border-primary ring-2 ring-primary ring-opacity-50"
                : ""
            }`}
            onClick={() => onSelectNote(note)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{note.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {note.content}
                </p>
              </div>
              <div className="flex space-x-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNote(note);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4" />
                <span>{note.category}</span>
              </div>
              <span>
                {formatDistanceToNow(new Date(note.updatedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default NoteList;