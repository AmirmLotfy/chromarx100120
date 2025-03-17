
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateTimerSuggestion } from '@/utils/timerAI';
import { localStorageClient as supabase } from "@/lib/local-storage-client";
import { TimerSession } from "@/types/timer";

interface TimerSuggestionProps {
  onSelectSuggestion: (duration: number, mode: 'focus' | 'break') => void;
  taskContext?: string;
}

const TimerSuggestions: React.FC<TimerSuggestionProps> = ({ onSelectSuggestion, taskContext }) => {
  const [suggestions, setSuggestions] = useState<Array<{ duration: number; reason: string; mode: 'focus' | 'break' }>>([]);
  const [loading, setLoading] = useState(true);
  const [previousSessions, setPreviousSessions] = useState<TimerSession[]>([]);

  useEffect(() => {
    const fetchPreviousSessions = async () => {
      try {
        const result = await supabase
          .from('timer_sessions')
          .select('*')
          .order('start_time', { ascending: false })
          .execute();

        if (result.data) {
          setPreviousSessions(result.data.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching previous sessions:', error);
      }
    };

    fetchPreviousSessions();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        // Get suggestions based on context and previous sessions
        const aiSuggestions = await generateTimerSuggestion({
          taskContext: taskContext || 'General work',
          previousSessions
        });
        
        setSuggestions(aiSuggestions);
      } catch (error) {
        console.error('Error generating suggestions:', error);
        // Fallback suggestions
        setSuggestions([
          { duration: 25, reason: 'Standard pomodoro session', mode: 'focus' },
          { duration: 5, reason: 'Short break', mode: 'break' },
          { duration: 50, reason: 'Deep work session', mode: 'focus' },
          { duration: 15, reason: 'Longer break', mode: 'break' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [taskContext, previousSessions]);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium">Suggested Timers</h3>
      {loading ? (
        <div className="space-y-2">
          <Card className="p-3 animate-pulse bg-muted h-16" />
          <Card className="p-3 animate-pulse bg-muted h-16" />
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <Card 
              key={index} 
              className="p-3 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onSelectSuggestion(suggestion.duration, suggestion.mode)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{suggestion.duration} min</span>
                    <Badge variant={suggestion.mode === 'focus' ? 'default' : 'secondary'}>
                      {suggestion.mode === 'focus' ? 'Focus' : 'Break'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
                </div>
                <Button size="sm" variant="outline">Select</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimerSuggestions;
