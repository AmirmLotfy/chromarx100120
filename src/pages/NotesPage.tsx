import { useState } from "react";
import Layout from "@/components/Layout";
import NoteEditor from "@/components/notes/NoteEditor";
import NoteList from "@/components/notes/NoteList";
import { Note } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem("notes");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const handleSaveNote = (note: Note) => {
    if (selectedNote) {
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? note : n))
      );
      toast.success("Note updated successfully");
    } else {
      setNotes((prev) => [...prev, note]);
      toast.success("Note created successfully");
    }
    localStorage.setItem("notes", JSON.stringify(notes));
    setSelectedNote(null);
  };

  const handleCreateNew = () => {
    setSelectedNote(null);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
    localStorage.setItem("notes", JSON.stringify(notes.filter((note) => note.id !== id)));
    toast.success("Note deleted successfully");
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notes</h1>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-4">
            <NoteList
              notes={notes}
              selectedNote={selectedNote}
              onSelectNote={setSelectedNote}
              onDeleteNote={handleDeleteNote}
            />
          </div>
          <div className="md:col-span-2">
            <NoteEditor
              note={selectedNote}
              onSave={handleSaveNote}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotesPage;