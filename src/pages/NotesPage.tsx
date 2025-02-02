import { useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Note, NoteView } from "@/types/note";
import NoteGrid from "@/components/notes/NoteGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Grid, 
  List, 
  Plus, 
  Search,
  Trash2,
  BarChart2
} from "lucide-react";
import { toast } from "sonner";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { getGeminiResponse } from "@/utils/geminiUtils";

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem("notes");
    return saved ? JSON.parse(saved) : [];
  });

  const [view, setView] = useState<NoteView>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotes, setSelectedNotes] = useState(new Set<string>());
  const { checkAccess, checkUsageLimit } = useFeatureAccess();

  const handleCreateNote = () => {
    if (!checkUsageLimit("notes")) return;

    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "New Note",
      content: "",
      tags: [],
      category: "uncategorized",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => [...prev, newNote]);
    toast.success("New note created");
  };

  const handleDeleteNotes = () => {
    if (selectedNotes.size === 0) return;

    const updatedNotes = notes.filter((note) => !selectedNotes.has(note.id));
    setNotes(updatedNotes);
    setSelectedNotes(new Set());
    localStorage.setItem("notes", JSON.stringify(updatedNotes));
    toast.success(`${selectedNotes.size} note(s) deleted`);
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
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">Notes</h1>
          <div className="flex gap-2">
            <Button onClick={() => setView("grid")} variant={view === "grid" ? "default" : "outline"} size="icon">
              <Grid className="h-4 w-4" />
            </Button>
            <Button onClick={() => setView("list")} variant={view === "list" ? "default" : "outline"} size="icon">
              <List className="h-4 w-4" />
            </Button>
            <Button onClick={handleCreateNote}>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {selectedNotes.size > 0 && (
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDeleteNotes}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedNotes.size})
              </Button>
              <Button onClick={handleAnalyzeNotes}>
                <BarChart2 className="h-4 w-4 mr-2" />
                Analyze ({selectedNotes.size})
              </Button>
            </div>
          )}
        </div>

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
          onDeleteNote={(id) => {
            setNotes((prev) => prev.filter((note) => note.id !== id));
            setSelectedNotes((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            toast.success("Note deleted");
          }}
          onEditNote={(note) => {
            // To be implemented in the next phase
            toast.info("Edit feature coming soon");
          }}
          onAnalyzeNote={async (note) => {
            setSelectedNotes(new Set([note.id]));
            await handleAnalyzeNotes();
          }}
        />
      </div>
    </Layout>
  );
};

export default NotesPage;