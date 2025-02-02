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
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <AITimerSuggestions onSuggestion={handleAISuggestion} />
      
      <Card className="w-full p-4 space-y-6">
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
        
        {timerType === 'custom' ? (
          <CustomTimer initialMinutes={suggestedDuration} />
        ) : (
          <PomodoroTimer />
        )}
      </Card>

      <Card className="w-full p-4">
        <Focus className="h-4 w-4 inline mr-1.5" />
        <h3 className="text-sm font-medium inline">Focus Mode</h3>
        <FocusMode />
      </Card>

      <Card className="w-full p-4">
        <BarChart className="h-4 w-4 inline mr-1.5" />
        <h3 className="text-sm font-medium inline">Time Analytics</h3>
        <TimeAnalytics />
      </Card>
    </div>
  );
};

export default TimeManagement;