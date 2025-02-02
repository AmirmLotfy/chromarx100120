import { useState, useEffect } from "react";
import { Note } from "@/types/note";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getGeminiResponse } from "@/utils/geminiUtils";
import { toast } from "sonner";
import {
  Wand2,
  Save,
  Archive,
  Tag,
  FileText,
  Sparkles,
} from "lucide-react";

interface NoteEditorProps {
  note?: Note | null;
  onSave: (note: Note) => void;
}

const NoteEditor = ({ note, onSave }: NoteEditorProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [category, setCategory] = useState(note?.category || "other");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
      setTags(note.tags);
    }
  }, [note]);

  const generateSummary = async () => {
    if (!content) {
      toast.error("Please add some content first");
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const response = await getGeminiResponse({
        prompt: content,
        type: "summarize",
        language: "en",
        contentType: "note"
      });

      const summary = response.result;
      toast.success("Summary generated successfully");
      setContent((prev) => `${prev}\n\nAI Summary:\n${summary}`);
    } catch (error) {
      toast.error("Failed to generate summary");
      console.error("Summary generation error:", error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSave = () => {
    if (!title || !content) {
      toast.error("Title and content are required");
      return;
    }

    const newNote: Note = {
      id: note?.id || crypto.randomUUID(),
      title,
      content,
      category,
      tags,
      createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: note?.isArchived || false,
      version: (note?.version || 0) + 1,
      versions: [
        ...(note?.versions || []),
        {
          content,
          timestamp: new Date().toISOString(),
          version: (note?.version || 0) + 1,
        },
      ],
    };

    onSave(newNote);
    toast.success("Note saved successfully");
  };

  return (
    <Card className="p-4 h-full flex flex-col space-y-4 bg-background/60 backdrop-blur-sm border-accent">
      <div className="flex flex-col space-y-4">
        <Input
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold"
        />
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateSummary}
            disabled={isGeneratingSummary}
          >
            {isGeneratingSummary ? (
              <Sparkles className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Summarize
          </Button>
          
          <Button variant="outline" size="sm">
            <Tag className="h-4 w-4 mr-2" />
            Add Tag
          </Button>
        </div>

        <Textarea
          placeholder="Start writing your note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 min-h-[300px] resize-none"
        />
      </div>

      <div className="flex justify-end space-x-2 mt-4">
        <Button variant="outline" size="sm">
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    </Card>
  );
};

export default NoteEditor;