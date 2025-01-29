import { Note } from "@/types/note";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Trash2, Search } from "lucide-react";
import { useState } from "react";

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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags?.some(tag => 
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="relative flex-shrink-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          {filteredNotes.length === 0 ? (
            <p className="text-center text-muted-foreground p-4">
              No notes found
            </p>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedNote?.id === note.id
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                }`}
                onClick={() => onSelectNote(note)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium line-clamp-1">{note.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {note.content}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {note.category}
                      </span>
                      {note.tags?.map(tag => (
                        <span key={tag} className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default NoteList;