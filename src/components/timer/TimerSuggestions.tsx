
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { suggestTimerDuration } from "@/utils/geminiUtils";
import { useLanguage } from "@/stores/languageStore";

interface TimerSuggestionsProps {
  onSelectDuration: (minutes: number) => void;
}

export const TimerSuggestions = ({ onSelectDuration }: TimerSuggestionsProps) => {
  const [suggestion, setSuggestion] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentLanguage } = useLanguage();

  const getSuggestion = async () => {
    try {
      setLoading(true);
      const suggestedMinutes = await suggestTimerDuration(
        "I need to focus on coding and implementing new features",
        currentLanguage.code
      );
      
      if (!isNaN(suggestedMinutes)) {
        setSuggestion(suggestedMinutes);
      }
    } catch (error) {
      console.error("Error getting timer suggestion:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSuggestion();
  }, []);

  if (!suggestion) return null;

  return (
    <Card className="p-4 bg-accent/50">
      <div className="flex items-center gap-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">AI Suggestion</p>
          <p className="text-sm text-muted-foreground">
            {suggestion} minutes is optimal for your current task
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onSelectDuration(suggestion)}
        >
          Apply
        </Button>
      </div>
    </Card>
  );
};
