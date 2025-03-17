
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { localStorageClient as supabase } from '@/lib/local-storage-client';
import { Clock, Target, Brain, Calendar } from 'lucide-react';
import { suggestTimerDuration } from '@/utils/geminiUtils';

export interface TimerSuggestionProps {
  onSelectDuration: (mins: number) => void;
  taskContext: string;
  mode: "focus" | "break";
}

const TimerSuggestions: React.FC<TimerSuggestionProps> = ({ 
  onSelectDuration, 
  taskContext, 
  mode 
}) => {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<{ duration: number; reason: string }[]>([]);
  const [personalSuggestion, setPersonalSuggestion] = useState<number | null>(null);

  useEffect(() => {
    async function loadSuggestions() {
      try {
        setLoading(true);
        
        // Get task data if context exists
        if (taskContext) {
          const suggestedDuration = await suggestTimerDuration(taskContext, mode);
          setPersonalSuggestion(suggestedDuration);
        }
        
        // Set default suggestions
        setSuggestions([
          { duration: 25, reason: 'Classic Pomodoro technique' },
          { duration: 50, reason: 'Extended focus session' },
          { duration: 90, reason: 'Deep work block' },
          { duration: mode === 'focus' ? 45 : 10, reason: 'Balanced productivity' }
        ]);
      } catch (error) {
        console.error("Error loading timer suggestions:", error);
        setSuggestions([
          { duration: 25, reason: 'Classic Pomodoro technique' },
          { duration: 50, reason: 'Extended focus session' }
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadSuggestions();
  }, [taskContext, mode]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-[60px] w-full" />
        <Skeleton className="h-[60px] w-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {personalSuggestion && (
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1">
                  <Brain className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-primary">AI Suggestion</span>
                </div>
                <p className="text-sm font-medium mt-1">{personalSuggestion} minutes</p>
                <p className="text-xs text-muted-foreground mt-0.5">Based on your task context</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7"
                onClick={() => onSelectDuration(personalSuggestion)}
              >
                Select
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {suggestions.map((suggestion, index) => (
        <Card key={index}>
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium">{suggestion.duration} minutes</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{suggestion.reason}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7"
                onClick={() => onSelectDuration(suggestion.duration)}
              >
                Select
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TimerSuggestions;
