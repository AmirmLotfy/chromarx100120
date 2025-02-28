
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import NoteGrid from "@/components/notes/NoteGrid";
import NoteOrganizer from "@/components/notes/NoteOrganizer";
import { Note, NoteSort } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Plus, List, LayoutGrid } from "lucide-react";
import { noteService } from "@/services/noteService";
import { toast } from "sonner";

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<NoteSort>({
    field: "updatedAt",
    direction: "desc",
  });

  useEffect(() => {
    loadNotes();
    
    // Subscribe to note changes
    const unsubscribe = noteService.subscribeToNotesChanges((updatedNotes) => {
      setNotes(updatedNotes);
      setFilteredNotes(updatedNotes);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const notes = await noteService.getAllNotes();
      setNotes(notes);
      setFilteredNotes(notes);
    } catch (error) {
      console.error("Error loading notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(note.id)) {
        newSet.delete(note.id);
      } else {
        newSet.add(note.id);
      }
      return newSet;
    });
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await noteService.deleteNote(id);
      setNotes(notes.filter((note) => note.id !== id));
      setFilteredNotes(filteredNotes.filter((note) => note.id !== id));
      setSelectedNotes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success("Note deleted");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  const handleEditNote = (updatedNote: Note) => {
    const updatedNotes = notes.map((note) =>
      note.id === updatedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);
    setFilteredNotes(
      filteredNotes.map((note) =>
        note.id === updatedNote.id ? updatedNote : note
      )
    );
  };

  const handleAnalyzeNote = (note: Note) => {
    toast.info("Analyzing note...");
    // Implement note analysis functionality
  };

  const handleConvertToTask = (note: Note) => {
    toast.info("Converting to task...");
    // Implement conversion to task
  };

  const handleLinkBookmark = (note: Note) => {
    toast.info("Linking bookmark...");
    // Implement bookmark linking
  };

  const handleCreateNote = async () => {
    try {
      const newNote: Omit<Note, "id"> = {
        title: "New Note",
        content: "",
        tags: [],
        category: "uncategorized",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const createdNote = await noteService.createNote(newNote);
      if (createdNote) {
        setNotes([createdNote, ...notes]);
        setFilteredNotes([createdNote, ...filteredNotes]);
        toast.success("New note created");
      }
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    }
  };

  const handleMoveToFolder = async (noteId: string, folderId: string) => {
    try {
      const noteToUpdate = notes.find(note => note.id === noteId);
      if (!noteToUpdate) return;
      
      const updatedNote = {
        ...noteToUpdate,
        folderId: folderId,
      };
      
      const result = await noteService.updateNote(updatedNote);
      if (result) {
        handleEditNote(updatedNote);
        toast.success("Note moved to folder");
      }
    } catch (error) {
      console.error("Error moving note to folder:", error);
      toast.error("Failed to move note");
    }
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleSyncNotes = async () => {
    try {
      toast.loading("Syncing notes...");
      await noteService.syncNotesWithSupabase();
      await loadNotes();
      toast.success("Notes synced successfully");
    } catch (error) {
      console.error("Error syncing notes:", error);
      toast.error("Failed to sync notes");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notes</h1>
            <p className="text-muted-foreground">
              {filteredNotes.length} note{filteredNotes.length !== 1 && "s"}
            </p>
          </div>
          <div className="flex mt-4 sm:mt-0 space-x-2">
            <Button onClick={() => setView(view === "grid" ? "list" : "grid")} variant="outline">
              {view === "grid" ? (
                <List className="h-4 w-4 mr-2" />
              ) : (
                <LayoutGrid className="h-4 w-4 mr-2" />
              )}
              {view === "grid" ? "List View" : "Grid View"}
            </Button>
            <Button onClick={handleCreateNote}>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
            <Button onClick={handleSyncNotes} variant="outline">
              Sync
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <NoteOrganizer
              notes={notes}
              onFilterChange={setFilteredNotes}
              onSortChange={setSort}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedTags={selectedTags}
              onSelectTag={handleSelectTag}
              selectedFolder={selectedFolder}
              onSelectFolder={setSelectedFolder}
              currentSort={sort}
            />
          </div>
          <div className="md:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading notes...</p>
              </div>
            ) : (
              <NoteGrid
                notes={filteredNotes}
                selectedNotes={selectedNotes}
                onSelectNote={handleSelectNote}
                onDeleteNote={handleDeleteNote}
                onEditNote={handleEditNote}
                onAnalyzeNote={handleAnalyzeNote}
                onConvertToTask={handleConvertToTask}
                onLinkBookmark={handleLinkBookmark}
                onMoveToFolder={handleMoveToFolder}
                sort={sort}
                view={view}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotesPage;
