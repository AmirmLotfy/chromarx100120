import { useState } from "react";
import { Card } from "@/components/ui/card";
import CustomTimer from "./CustomTimer";
import PomodoroTimer from "./PomodoroTimer";
import FocusMode from "./FocusMode";
import TimeAnalytics from "./TimeAnalytics";
import AITimerSuggestions from "./AITimerSuggestions";
import { Toggle } from "@/components/ui/toggle";
import { Timer, Brain, Focus, BarChart } from "lucide-react";

const TimeManagement = () => {
  const [timerType, setTimerType] = useState<'custom' | 'pomodoro'>('custom');
  const [suggestedDuration, setSuggestedDuration] = useState<number | null>(null);

  const handleAISuggestion = (duration: number) => {
    setSuggestedDuration(duration);
  };

  return (
    <div className="container mx-auto px-4 max-w-2xl space-y-4">
      <Card className="p-4 shadow-sm">
        <AITimerSuggestions onSuggestion={handleAISuggestion} />
      </Card>
      
      <Card className="p-4 shadow-sm">
        <div className="space-y-6">
          <div className="flex justify-center gap-2">
            <Toggle
              pressed={timerType === 'custom'}
              onPressedChange={() => setTimerType('custom')}
              className="data-[state=on]:bg-primary/10 px-3 py-1 text-sm"
              aria-label="Custom Timer"
            >
              <Timer className="h-4 w-4 mr-1.5" />
              Custom
            </Toggle>
            <Toggle
              pressed={timerType === 'pomodoro'}
              onPressedChange={() => setTimerType('pomodoro')}
              className="data-[state=on]:bg-primary/10 px-3 py-1 text-sm"
              aria-label="Pomodoro Timer"
            >
              <Brain className="h-4 w-4 mr-1.5" />
              Pomodoro
            </Toggle>
          </div>
          
          <div className="transition-all duration-300">
            {timerType === 'custom' ? (
              <CustomTimer initialMinutes={suggestedDuration} />
            ) : (
              <PomodoroTimer />
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Focus className="h-4 w-4" />
            <h3 className="text-sm font-medium">Focus Mode</h3>
          </div>
          <FocusMode />
        </div>
      </Card>

      <Card className="p-4 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <BarChart className="h-4 w-4" />
            <h3 className="text-sm font-medium">Time Analytics</h3>
          </div>
          <TimeAnalytics />
        </div>
      </Card>
    </div>
  );
};

export default TimeManagement;