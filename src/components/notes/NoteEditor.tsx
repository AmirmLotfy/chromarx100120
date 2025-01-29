import { useState, useEffect } from "react";
import { Note } from "@/types/note";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, Copy, WhatsappLogo } from "lucide-react";
import { toast } from "sonner";

interface NoteEditorProps {
  note: Note | null;
  onSave: (note: Note) => void;
}

const NoteEditor = ({ note, onSave }: NoteEditorProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [category, setCategory] = useState(note?.category || "");

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
    } else {
      setTitle("");
      setContent("");
      setCategory("");
    }
  }, [note]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const updatedNote: Note = {
      id: note?.id || crypto.randomUUID(),
      title,
      content,
      category,
      createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedNote);
    setTitle("");
    setContent("");
    setCategory("");
  };

  const handleShare = async (type: 'copy' | 'whatsapp' | 'email') => {
    const noteText = `${title}\n\n${content}`;
    
    switch (type) {
      case 'copy':
        await navigator.clipboard.writeText(noteText);
        toast.success("Note copied to clipboard");
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(noteText)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(content)}`);
        break;
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <Input
        placeholder="Note title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg">
          <SelectItem value="personal">Personal</SelectItem>
          <SelectItem value="work">Work</SelectItem>
          <SelectItem value="study">Study</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>

      <Textarea
        placeholder="Write your note here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[200px]"
      />

      <div className="flex justify-between items-center">
        <Button onClick={handleSave}>
          Save Note
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('copy')}
            title="Copy to clipboard"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('whatsapp')}
            title="Share via WhatsApp"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('email')}
            title="Share via Email"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;