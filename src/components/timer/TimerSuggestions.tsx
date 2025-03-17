
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BrainCircuit, Clock, Pencil } from 'lucide-react';
import { localStorageClient as supabase } from '@/lib/local-storage-client';
import { getTimerSuggestion } from '@/utils/timerAI';

type TimerMode = 'focus' | 'break';

interface TimerSuggestionsProps {
  onSelectDuration: (duration: number, mode: TimerMode) => void;
}

const TimerSuggestions: React.FC<TimerSuggestionsProps> = ({ onSelectDuration }) => {
  const [suggestions, setSuggestions] = useState<Array<{ duration: number; reason: string; mode: TimerMode }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get suggestions on component mount
    generateSuggestions();
  }, []);

  const generateSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get user's tasks to inform suggestions
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*');

      // Get user's recent timer history
      const { data: timerHistory } = await supabase
        .from('timer_history')
        .select('*');

      // Either use the AI utility or create default suggestions
      let generatedSuggestions;
      try {
        // Try to generate suggestions with AI
        const taskContext = (tasks || []).map(task => task.title).join(', ');
        const suggestion = await getTimerSuggestion({
          taskContext,
          previousSessions: timerHistory || []
        });
        
        // Create suggestions based on AI response
        generatedSuggestions = [
          { duration: suggestion || 25, reason: 'AI recommended focus session', mode: 'focus' as TimerMode },
          { duration: Math.max(5, Math.floor((suggestion || 25) / 5)), reason: 'Quick break', mode: 'break' as TimerMode },
          { duration: 50, reason: 'Deep work session', mode: 'focus' as TimerMode },
          { duration: 15, reason: 'Recovery break', mode: 'break' as TimerMode },
        ];
      } catch (e) {
        console.error('Error generating AI suggestions:', e);
        // Fallback to default suggestions
        generatedSuggestions = [
          { duration: 25, reason: 'Standard pomodoro session', mode: 'focus' as TimerMode },
          { duration: 5, reason: 'Quick break', mode: 'break' as TimerMode },
          { duration: 50, reason: 'Deep work session', mode: 'focus' as TimerMode },
          { duration: 15, reason: 'Recovery break', mode: 'break' as TimerMode },
        ];
      }

      setSuggestions(generatedSuggestions);
    } catch (err) {
      console.error('Error loading suggestions:', err);
      setError('Failed to load suggestions');
      // Set some default suggestions
      setSuggestions([
        { duration: 25, reason: 'Standard pomodoro session', mode: 'focus' as TimerMode },
        { duration: 5, reason: 'Quick break', mode: 'break' as TimerMode },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Suggestions</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={generateSuggestions} 
          disabled={isLoading}
        >
          <BrainCircuit className="h-4 w-4 mr-2" />
          Regenerate
        </Button>
      </div>
      
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Generating suggestions...</p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {suggestions.map((suggestion, index) => (
            <Card key={index} className="p-3 cursor-pointer hover:bg-accent transition-colors" onClick={() => onSelectDuration(suggestion.duration, suggestion.mode)}>
              <div className="flex items-center">
                <div className="mr-3">
                  {suggestion.mode === 'focus' ? (
                    <Pencil className="h-5 w-5 text-primary" />
                  ) : (
                    <Clock className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {suggestion.duration} min {suggestion.mode === 'focus' ? 'focus' : 'break'}
                  </div>
                  <div className="text-sm text-muted-foreground">{suggestion.reason}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimerSuggestions;
