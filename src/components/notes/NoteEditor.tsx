
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Note, NoteSentiment } from "@/types/note";
import { Mic, Save, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { analyzeSentiment, summarizeContent } from "@/utils/geminiUtils";
import { useLanguage } from "@/stores/languageStore";
import emojiRegex from "emoji-regex";

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

  const preprocessContent = (text: string) => {
    // Extract emojis for additional context
    const emojis = text.match(emojiRegex()) || [];
    const emojiContext = emojis.length > 0 ? `Emojis used: ${emojis.join(" ")}. ` : "";

    // Clean text for analysis while preserving emojis
    const cleanedText = text
      .replace(/[^\p{L}\p{N}\p{P}\p{Z}\p{Emoji}]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      cleanedText,
      emojiContext,
      hasEmojis: emojis.length > 0
    };
  };

  const analyzeNote = async (noteContent: string) => {
    try {
      const { cleanedText, emojiContext, hasEmojis } = preprocessContent(noteContent);
      console.log("Analyzing note with language:", currentLanguage.code);
      console.log("Content has emojis:", hasEmojis);

      const analysisPrompt = `
Language: ${currentLanguage.code}
Content: ${cleanedText}
${emojiContext}
Please analyze the sentiment considering:
1. The overall tone and emotion
2. Cultural context of the language
3. Emoji usage if present
4. Contextual nuances
      `.trim();

      const [sentimentResult, summary] = await Promise.all([
        analyzeSentiment(analysisPrompt, currentLanguage.code),
        summarizeContent(cleanedText, currentLanguage.code)
      ]);

      // Extract sentiment details
      const [sentiment, score, confidence, dominantEmotion] = sentimentResult.split('|');
      
      return {
        sentiment: sentiment as NoteSentiment,
        sentimentDetails: {
          score: parseFloat(score),
          confidence: parseFloat(confidence),
          dominantEmotion,
          language: currentLanguage.code
        },
        summary
      };
    } catch (error) {
      console.error("Error analyzing note:", error);
      toast.error(`Failed to analyze note in ${currentLanguage.name}`);
      return {
        sentiment: 'neutral' as const,
        sentimentDetails: {
          score: 0,
          confidence: 0,
          language: currentLanguage.code
        },
        summary: ''
      };
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
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
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
        recognition.lang = currentLanguage.code; // Set recognition language

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join(" ");
          setContent(prev => prev + " " + transcript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          toast.error(`Error with voice recognition in ${currentLanguage.name}`);
          setIsRecording(false);
        };

        recognition.start();
        setRecognition(recognition);
        setIsRecording(true);
        toast.success(`Voice recording started in ${currentLanguage.name}`);
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
            placeholder={`Note title (${currentLanguage.name})`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full"
          />

          <div className="relative">
            <Textarea
              placeholder={`Start writing your note in ${currentLanguage.name}...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] w-full resize-none pr-10"
              dir={currentLanguage.code === 'ar' ? 'rtl' : 'ltr'} // RTL support for Arabic
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
                  Analyzing...
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
