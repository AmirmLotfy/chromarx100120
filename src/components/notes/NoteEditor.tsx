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
import { Share2, Copy, MessageSquare, Tags, Link } from "lucide-react";
import { toast } from "sonner";

interface NoteEditorProps {
  note: Note | null;
  onSave: (note: Note) => void;
}

const NoteEditor = ({ note, onSave }: NoteEditorProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [category, setCategory] = useState(note?.category || "");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [linkedTaskId, setLinkedTaskId] = useState(note?.linkedTaskId || "");

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
      setTags(note.tags || []);
      setLinkedTaskId(note.linkedTaskId || "");
    } else {
      setTitle("");
      setContent("");
      setCategory("");
      setTags([]);
      setLinkedTaskId("");
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
      tags,
      linkedTaskId,
      createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedNote);
    toast.success("Note saved successfully");
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

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-4 p-4 h-full flex flex-col">
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

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-accent text-accent-foreground rounded-full text-sm flex items-center gap-1"
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-destructive"
            >
              ×
            </button>
          </span>
        ))}
        <Input
          placeholder="Add tag..."
          className="w-32"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddTag((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
        />
      </div>

      <Textarea
        placeholder="Write your note here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 min-h-0 resize-none"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1 sm:flex-none">
            Save Note
          </Button>
          <Button
            variant="outline"
            onClick={() => setLinkedTaskId(prompt("Enter task ID") || "")}
            className="flex-1 sm:flex-none"
          >
            <Link className="h-4 w-4 mr-2" />
            Link Task
          </Button>
        </div>
        
        <div className="flex gap-2 justify-end mt-2 sm:mt-0">
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
            <MessageSquare className="h-4 w-4" />
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