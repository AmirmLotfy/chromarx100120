import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { suggestTimerDuration } from "@/utils/geminiUtils";
import { useLanguage } from "@/stores/languageStore";
import { toast } from "sonner";

interface TimerSuggestionsProps {
  onSelectDuration: (minutes: number) => void;
  taskContext?: string;
  mode: "focus" | "break";
}

export const TimerSuggestions = ({ 
  onSelectDuration, 
  taskContext = "focus and productivity",
  mode 
}: TimerSuggestionsProps) => {
  const [suggestion, setSuggestion] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);
  const { currentLanguage } = useLanguage();

  const getSuggestion = async () => {
    try {
      setLoading(true);
      
      const prompt = `Task Context: ${taskContext}
Mode: ${mode}
Previous feedback: ${feedback}
Please suggest an optimal duration in minutes for this ${mode} session.
Response should be ONLY the number of minutes.`;

      const suggestedMinutes = await suggestTimerDuration(prompt);
      
      if (!isNaN(suggestedMinutes)) {
        const validatedMinutes = Math.min(Math.max(suggestedMinutes, 5), 60);
        if (validatedMinutes !== suggestedMinutes) {
          console.log('Adjusted suggestion to be within reasonable bounds');
        }
        setSuggestion(validatedMinutes);
      } else {
        console.error("Invalid duration suggestion received");
        toast.error("Could not get a valid duration suggestion");
      }
    } catch (error) {
      console.error("Error getting timer suggestion:", error);
      toast.error("Failed to get AI suggestion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSuggestion();
  }, [mode, taskContext]);

  const handleFeedback = (isGood: boolean) => {
    setFeedback(isGood ? 'good' : 'bad');
    try {
      const feedbackKey = `timer_feedback_${mode}`;
      localStorage.setItem(feedbackKey, isGood ? 'good' : 'bad');
      
      if (!isGood) {
        getSuggestion();
      }
      
      toast.success("Thank you for your feedback!");
    } catch (error) {
      console.error("Error saving feedback:", error);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-accent/50">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-pulse text-primary" />
          <p className="text-sm">Getting AI suggestion...</p>
        </div>
      </Card>
    );
  }

  if (!suggestion) return null;

  return (
    <Card className="p-4 bg-accent/50">
      <div className="flex items-center gap-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">AI Suggestion</p>
          <p className="text-sm text-muted-foreground">
            {suggestion} minutes is optimal for your {mode} session
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hover:text-green-500"
            onClick={() => handleFeedback(true)}
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:text-red-500"
            onClick={() => handleFeedback(false)}
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSelectDuration(suggestion)}
          >
            Apply
          </Button>
        </div>
      </div>
    </Card>
  );
};
