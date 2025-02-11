
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Note } from "@/types/note";
import { Mic, Save, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { analyzeSentiment, summarizeContent } from "@/utils/geminiUtils";
import { useLanguage } from "@/stores/languageStore";

interface NoteEditorProps {
  note?: Note;
  onSave: (note: Partial<Note>) => void;
  onClose: () => void;
}

const NoteEditor = ({ note, onSave, onClose }: NoteEditorProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [recognition]);

  const analyzeNote = async (noteContent: string) => {
    try {
      const [sentiment, summary] = await Promise.all([
        analyzeSentiment(noteContent, currentLanguage.code),
        summarizeContent(noteContent, currentLanguage.code)
      ]);

      return { sentiment, summary };
    } catch (error) {
      console.error("Error analyzing note:", error);
      return { sentiment: 'neutral' as const, summary: '' };
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsProcessing(true);
    try {
      const analysis = await analyzeNote(content);
      
      await onSave({
        title,
        content,
        updatedAt: new Date().toISOString(),
        ...analysis
      });
      
      toast.success("Note saved successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to save note");
      console.error("Error saving note:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (!isRecording) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join(" ");
          setContent(prev => prev + " " + transcript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          toast.error("Error with voice recognition");
          setIsRecording(false);
        };

        recognition.start();
        setRecognition(recognition);
        setIsRecording(true);
        toast.success("Voice recording started");
      } catch (error) {
        console.error("Speech recognition not supported:", error);
        toast.error("Voice recognition not supported in this browser");
      }
    } else {
      recognition?.stop();
      setRecognition(null);
      setIsRecording(false);
      toast.success("Voice recording stopped");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-[50%] translate-y-[-50%] max-h-[90vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-lg sm:inset-x-auto sm:left-[50%] sm:translate-x-[-50%] sm:max-w-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {note ? "Edit Note" : "New Note"}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Input
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full"
          />

          <div className="relative">
            <Textarea
              placeholder="Start writing your note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] w-full resize-none pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute bottom-2 right-2",
                isRecording && "text-red-500"
              )}
              onClick={toggleVoiceRecording}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Note
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
