import { useState } from "react";
import Layout from "@/components/Layout";
import NoteEditor from "@/components/notes/NoteEditor";
import NoteList from "@/components/notes/NoteList";
import { Note } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? note : n))
      );
      toast.success("Note updated successfully");
    } else {
      setNotes((prev) => [...prev, note]);
      toast.success("Note created successfully");
    }
    localStorage.setItem("notes", JSON.stringify(notes));
    if (isMobile) {
      setShowEditor(false);
    }
    setSelectedNote(null);
  };

  const handleCreateNew = () => {
    setSelectedNote(null);
    setShowEditor(true);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setShowEditor(true);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
    localStorage.setItem(
      "notes",
      JSON.stringify(notes.filter((note) => note.id !== id))
    );
    toast.success("Note deleted successfully");
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  const handleBack = () => {
    setShowEditor(false);
    setSelectedNote(null);
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
        <div className="flex items-center justify-between px-4">
          <h1 className="text-xl font-bold md:text-2xl">Notes</h1>
          <Button onClick={handleCreateNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
        
        <div className="flex-1 relative overflow-hidden">
          {(!isMobile || !showEditor) && (
            <div className="absolute inset-0 overflow-hidden">
              <NoteList
                notes={notes}
                selectedNote={selectedNote}
                onSelectNote={handleSelectNote}
                onDeleteNote={handleDeleteNote}
              />
            </div>
          )}
          
          {(!isMobile || showEditor) && (
            <div className="absolute inset-0 overflow-hidden md:left-auto md:w-2/3">
              <div className="h-full flex flex-col">
                {isMobile && (
                  <Button 
                    variant="ghost" 
                    className="self-start mb-2 ml-2"
                    onClick={handleBack}
                  >
                    ← Back to Notes
                  </Button>
                )}
                <NoteEditor
                  note={selectedNote}
                  onSave={handleSaveNote}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NotesPage;