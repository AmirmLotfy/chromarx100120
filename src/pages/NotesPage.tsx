
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import NoteEditor from "@/components/notes/NoteEditor";
import NoteCard from "@/components/notes/NoteCard";
import NoteGrid from "@/components/notes/NoteGrid";
import NoteActions from "@/components/notes/NoteActions";
import { useToast } from "@/hooks/use-toast";
import { NoteService } from "@/services/noteService";
import { Note } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FilePlus, Search, ArrowDownAZ } from "lucide-react";
import { Input } from "@/components/ui/input";

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [sortBy, setSortBy] = useState<"updatedAt" | "createdAt" | "title">("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    filterAndSortNotes();
  }, [notes, searchQuery, sortBy, sortDirection]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const fetchedNotes = await NoteService.getAllNotes();
      // Map to ensure notes have the required category property
      const notesWithCategory = fetchedNotes.map(note => ({
        ...note,
        category: note.category || "",
        tags: note.tags || [],
        createdAt: typeof note.createdAt === 'string' ? note.createdAt : new Date(note.createdAt).toISOString(),
        updatedAt: typeof note.updatedAt === 'string' ? note.updatedAt : new Date(note.updatedAt).toISOString()
      }));
      setNotes(notesWithCategory);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortNotes = () => {
    let filtered = [...notes];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }

    // Sort notes
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "updatedAt") {
        const timeA = new Date(a.updatedAt).getTime();
        const timeB = new Date(b.updatedAt).getTime();
        comparison = timeA - timeB;
      } else if (sortBy === "createdAt") {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        comparison = timeA - timeB;
      } else if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title);
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });

    setFilteredNotes(filtered);
  };

  const handleCreateNote = () => {
    setCurrentNote(null);
    setIsEditing(true);
  };

  const handleEditNote = (note: Note) => {
    setCurrentNote(note);
    setIsEditing(true);
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    try {
      if (currentNote) {
        // Editing existing note
        const updatedNote = await NoteService.updateNote(currentNote.id, noteData);
        if (updatedNote) {
          // Ensure the note has the required category property
          const completeNote: Note = {
            ...updatedNote,
            category: updatedNote.category || "",
            tags: updatedNote.tags || [],
            createdAt: typeof updatedNote.createdAt === 'string' ? updatedNote.createdAt : new Date(updatedNote.createdAt).toISOString(),
            updatedAt: typeof updatedNote.updatedAt === 'string' ? updatedNote.updatedAt : new Date(updatedNote.updatedAt).toISOString()
          };
          
          setNotes((prevNotes) =>
            prevNotes.map((note) =>
              note.id === completeNote.id ? completeNote : note
            )
          );
          toast({
            title: "Success",
            description: "Note updated successfully",
          });
        }
      } else {
        // Creating new note
        const newNote = await NoteService.createNote({
          title: noteData.title || "",
          content: noteData.content || "",
          userId: "current-user", // This would come from auth context in a real app
        });
        if (newNote) {
          // Ensure the note has the required category property
          const completeNote: Note = {
            ...newNote,
            category: newNote.category || "",
            tags: newNote.tags || [],
            createdAt: typeof newNote.createdAt === 'string' ? newNote.createdAt : new Date(newNote.createdAt).toISOString(),
            updatedAt: typeof newNote.updatedAt === 'string' ? newNote.updatedAt : new Date(newNote.updatedAt).toISOString()
          };
          
          setNotes((prevNotes) => [completeNote, ...prevNotes]);
          toast({
            title: "Success",
            description: "Note created successfully",
          });
        }
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const success = await NoteService.deleteNote(noteId);
      if (success) {
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
        toast({
          title: "Success",
          description: "Note deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading your notes...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notes</h1>
          <Button onClick={handleCreateNote}>
            <FilePlus className="h-5 w-5 mr-2" />
            New Note
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={toggleSortDirection}
            className="flex items-center gap-2"
          >
            <ArrowDownAZ className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''} transition-transform`} />
            {sortBy === "updatedAt" ? "Last Updated" : 
             sortBy === "createdAt" ? "Date Created" : "Title"}
          </Button>
        </div>

        <Tabs defaultValue="grid" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-4">
            {filteredNotes.length > 0 ? (
              <NoteGrid notes={filteredNotes} onEdit={handleEditNote} onDelete={handleDeleteNote} />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No notes found</p>
                <Button variant="outline" onClick={handleCreateNote} className="mt-4">
                  Create your first note
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            {filteredNotes.length > 0 ? (
              filteredNotes.map(note => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onEdit={() => handleEditNote(note)} 
                  onDelete={() => handleDeleteNote(note.id)} 
                />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No notes found</p>
                <Button variant="outline" onClick={handleCreateNote} className="mt-4">
                  Create your first note
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {isEditing && (
          <NoteEditor
            note={currentNote}
            onSave={handleSaveNote}
            onClose={() => setIsEditing(false)}
          />
        )}
      </div>
    </Layout>
  );
};

export default NotesPage;
