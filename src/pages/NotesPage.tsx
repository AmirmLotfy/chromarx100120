
import { useState, useCallback, useEffect } from "react";
import { Note } from "@/types/note";
import NoteGrid from "@/components/notes/NoteGrid";
import NoteEditor from "@/components/notes/NoteEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, BarChart2, Cloud } from "lucide-react";
import { toast } from "sonner";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { getGeminiResponse } from "@/utils/geminiUtils";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { noteService } from "@/services/noteService";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotes, setSelectedNotes] = useState(new Set<string>());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();
  const [isSyncing, setIsSyncing] = useState(false);
  const { checkAccess, checkUsageLimit } = useFeatureAccess();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadNotes();
    const subscription = noteService.subscribeToNoteChanges((updatedNote) => {
      setNotes((prevNotes) => {
        const noteExists = prevNotes.some((note) => note.id === updatedNote.id);
        if (noteExists) {
          return prevNotes.map((note) =>
            note.id === updatedNote.id ? updatedNote : note
          );
        }
        return [updatedNote, ...prevNotes];
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadNotes = async () => {
    const fetchedNotes = await noteService.getAllNotes();
    setNotes(fetchedNotes);
  };

  const handleViewChange = (newView: "grid" | "list") => {
    setView(newView);
  };

  const handleCreateNote = () => {
    if (!checkUsageLimit("notes")) return;
    setEditingNote(undefined);
    setIsEditorOpen(true);
  };

  const handleSyncNotes = async () => {
    setIsSyncing(true);
    try {
      await noteService.syncNotesWithSupabase();
      await loadNotes();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConvertToTask = async (note: Note) => {
    if (!await checkAccess("task_creation")) return;

    try {
      localStorage.setItem("noteToTask", JSON.stringify({
        title: note.title,
        description: note.content,
        noteId: note.id
      }));
      
      navigate("/tasks");
      toast.success("Note converted to task");
    } catch (error) {
      console.error("Error converting note to task:", error);
      toast.error("Failed to convert note to task");
    }
  };

  const handleLinkBookmark = async (note: Note) => {
    if (!await checkAccess("bookmark_linking")) return;

    try {
      localStorage.setItem("noteForBookmark", note.id);
      
      navigate("/bookmarks");
      toast.success("Select a bookmark to link to this note");
    } catch (error) {
      console.error("Error linking bookmark:", error);
      toast.error("Failed to link bookmark");
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    if (editingNote) {
      const updatedNote = await noteService.updateNote({
        ...editingNote,
        ...noteData,
      });
      if (updatedNote) {
        setNotes((prev) =>
          prev.map((note) => (note.id === editingNote.id ? updatedNote : note))
        );
      }
    } else {
      const newNote = await noteService.createNote({
        title: noteData.title || "",
        content: noteData.content || "",
        tags: [],
        category: "uncategorized",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      if (newNote) {
        setNotes((prev) => [newNote, ...prev]);
      }
    }
    setIsEditorOpen(false);
    setEditingNote(undefined);
  };

  const handleDeleteNotes = async () => {
    if (selectedNotes.size === 0) return;

    const deletePromises = Array.from(selectedNotes).map((noteId) =>
      noteService.deleteNote(noteId)
    );

    try {
      await Promise.all(deletePromises);
      setNotes((prev) => prev.filter((note) => !selectedNotes.has(note.id)));
      setSelectedNotes(new Set());
      toast.success(`${selectedNotes.size} note(s) deleted`);
    } catch (error) {
      console.error("Error deleting notes:", error);
      toast.error("Failed to delete some notes");
    }
  };

  const handleAnalyzeNotes = async () => {
    if (!await checkAccess("ai_analysis")) return;
    
    try {
      const selectedNotesList = notes.filter((note) => selectedNotes.has(note.id));
      
      for (const note of selectedNotesList) {
        const [sentimentResponse, summaryResponse] = await Promise.all([
          getGeminiResponse({
            prompt: note.content,
            type: "sentiment",
            language: "en"
          }),
          getGeminiResponse({
            prompt: note.content,
            type: "summarize",
            language: "en"
          })
        ]);

        if (sentimentResponse.error || summaryResponse.error) {
          toast.error("Failed to analyze some notes");
          continue;
        }

        const updatedNote = {
          ...note,
          sentiment: sentimentResponse.result as Note["sentiment"],
          summary: summaryResponse.result
        };

        setNotes((prev) => 
          prev.map((n) => n.id === note.id ? updatedNote : n)
        );
      }

      toast.success("Notes analyzed successfully");
    } catch (error) {
      console.error("Error analyzing notes:", error);
      toast.error("Failed to analyze notes");
    }
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-80px)] bg-background">
        {/* Header section */}
        <div className="px-4 py-3 flex flex-col gap-3 bg-background/60 backdrop-blur-sm sticky top-0 z-10 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Notes</h1>
            <Button 
              onClick={handleCreateNote}
              size="icon"
              className="h-10 w-10 rounded-full shadow-md bg-primary hover:bg-primary/90 transition-all"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border-input/60 bg-background shadow-sm"
            />
          </div>

          {selectedNotes.size > 0 && (
            <div className="flex gap-2 animate-fade-in">
              <Button 
                variant="destructive" 
                onClick={handleDeleteNotes}
                size={isMobile ? "sm" : "default"}
                className="rounded-xl flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedNotes.size})
              </Button>
              <Button 
                onClick={handleAnalyzeNotes}
                size={isMobile ? "sm" : "default"}
                className="rounded-xl flex-1"
              >
                <BarChart2 className="h-4 w-4 mr-2" />
                Analyze ({selectedNotes.size})
              </Button>
            </div>
          )}
        </div>

        {/* Notes content */}
        <ScrollArea className="flex-1 px-2 pb-16">
          <NoteGrid
            notes={filteredNotes}
            selectedNotes={selectedNotes}
            onSelectNote={(note) => {
              setSelectedNotes((prev) => {
                const next = new Set(prev);
                if (next.has(note.id)) {
                  next.delete(note.id);
                } else {
                  next.add(note.id);
                }
                return next;
              });
            }}
            onDeleteNote={async (id) => {
              await noteService.deleteNote(id);
              setNotes((prev) => prev.filter((note) => note.id !== id));
              setSelectedNotes((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
              toast.success("Note deleted");
            }}
            onEditNote={handleEditNote}
            onAnalyzeNote={async (note) => {
              setSelectedNotes(new Set([note.id]));
              await handleAnalyzeNotes();
            }}
            onConvertToTask={handleConvertToTask}
            onLinkBookmark={handleLinkBookmark}
            view="grid"
          />
        </ScrollArea>

        {/* Floating sync button */}
        <Button
          variant="outline"
          onClick={handleSyncNotes}
          disabled={isSyncing}
          className="absolute bottom-20 right-4 h-10 w-10 rounded-full shadow-md"
        >
          <Cloud className={`h-5 w-5 ${isSyncing ? "animate-spin" : ""}`} />
        </Button>

        {isEditorOpen && (
          <NoteEditor
            note={editingNote}
            onSave={handleSaveNote}
            onClose={() => {
              setIsEditorOpen(false);
              setEditingNote(undefined);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default NotesPage;
