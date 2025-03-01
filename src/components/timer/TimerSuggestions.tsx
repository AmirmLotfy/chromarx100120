
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react";
import { suggestTimerDuration, checkGeminiAvailability } from "@/utils/geminiUtils";
import { useLanguage } from "@/stores/languageStore";
import { toast } from "sonner";
import { AIProgressIndicator } from "@/components/ui/ai-progress-indicator";

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
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const { currentLanguage } = useLanguage();

  // Check API availability when component mounts
  useEffect(() => {
    const checkApiStatus = async () => {
      const available = await checkGeminiAvailability();
      setApiAvailable(available);
      
      if (!available) {
        // Use default durations if API is not available
        setSuggestion(mode === "focus" ? 25 : 5);
      }
    };
    
    checkApiStatus();
  }, [mode]);

  const getSuggestion = async () => {
    if (apiAvailable === false) {
      // Use default times based on mode if API is unavailable
      setSuggestion(mode === "focus" ? 25 : 5);
      return;
    }
    
    try {
      setLoading(true);
      
      // Create a more detailed prompt based on context and mode
      const prompt = `Task Context: ${taskContext}
Mode: ${mode}
Previous feedback: ${feedback}
Please suggest an optimal duration in minutes for this ${mode} session, considering:
1. The nature of the task
2. Best practices for ${mode} sessions
3. User's previous feedback
Response should be ONLY the number of minutes.`;

      const suggestedMinutes = await suggestTimerDuration(prompt, currentLanguage.code);
      
      if (!isNaN(suggestedMinutes)) {
        // Validate suggestion within reasonable bounds
        const validatedMinutes = Math.min(Math.max(suggestedMinutes, 5), 60);
        if (validatedMinutes !== suggestedMinutes) {
          console.log('Adjusted suggestion to be within reasonable bounds');
        }
        setSuggestion(validatedMinutes);
      } else {
        console.error("Invalid duration suggestion received");
        toast.error("Could not get a valid duration suggestion");
        // Fallback to standard durations
        setSuggestion(mode === "focus" ? 25 : 5);
      }
    } catch (error) {
      console.error("Error getting timer suggestion:", error);
      toast.error("Failed to get AI suggestion, using default value");
      // Fallback to standard durations
      setSuggestion(mode === "focus" ? 25 : 5);
    } finally {
      setLoading(false);
    }
  };

  // Refresh suggestion when mode or context changes
  useEffect(() => {
    getSuggestion();
  }, [mode, taskContext]);

  const handleFeedback = (isGood: boolean) => {
    setFeedback(isGood ? 'good' : 'bad');
    // Store feedback for future suggestions
    try {
      const feedbackKey = `timer_feedback_${mode}`;
      localStorage.setItem(feedbackKey, isGood ? 'good' : 'bad');
      
      if (!isGood) {
        // If feedback is negative, get a new suggestion
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
        <AIProgressIndicator 
          isLoading={true}
          message="Getting AI suggestion..."
          variant="minimal"
        />
      </Card>
    );
  }

  if (apiAvailable === false) {
    return (
      <Card className="p-4 bg-accent/50">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <p className="text-sm text-muted-foreground">
            Using standard {mode} duration: {suggestion} minutes
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto"
            onClick={() => onSelectDuration(suggestion || (mode === "focus" ? 25 : 5))}
          >
            Apply
          </Button>
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
