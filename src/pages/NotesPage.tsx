import Layout from "@/components/Layout";
import NoteEditor from "@/components/notes/NoteEditor";
import NoteList from "@/components/notes/NoteList";
import { Note } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem("notes");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const isMobile = useIsMobile();
  const [showEditor, setShowEditor] = useState(!isMobile);

  const handleSaveNote = (note: Note) => {
    if (selectedNote) {
      setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
      toast.success("Note updated successfully");
    } else {
      setNotes((prev) => [...prev, note]);
      toast.success("Note created successfully");
    }
    localStorage.setItem("notes", JSON.stringify(notes));
    if (isMobile) setShowEditor(false);
    setSelectedNote(null);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-8rem)] space-y-6 px-4 md:px-6 pb-20 md:pb-6 pt-6 md:pt-8">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Create and manage your notes
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setShowEditor(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <NoteList
            notes={notes}
            selectedNote={selectedNote}
            onSelectNote={setSelectedNote}
            onDeleteNote={(id) => {
              setNotes((prev) => prev.filter((n) => n.id !== id));
              toast.success("Note deleted successfully");
            }}
          />
          {showEditor && (
            <div className="bg-card rounded-lg border p-4">
              <NoteEditor note={selectedNote} onSave={handleSaveNote} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NotesPage;