import { useState } from "react";
import { Card } from "@/components/ui/card";
import CustomTimer from "./CustomTimer";
import PomodoroTimer from "./PomodoroTimer";
import FocusMode from "./FocusMode";
import TimeAnalytics from "./TimeAnalytics";
import AITimerSuggestions from "./AITimerSuggestions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timer, Brain, Focus, BarChart } from "lucide-react";

const TimeManagement = () => {
  const [suggestedDuration, setSuggestedDuration] = useState<number | null>(null);

  const handleAISuggestion = (duration: number) => {
    setSuggestedDuration(duration);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 md:col-span-2">
          <AITimerSuggestions onSuggestion={handleAISuggestion} />
        </Card>
        
        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14">
            <TabsTrigger value="custom" className="data-[state=active]:bg-primary/10">
              <Timer className="mr-2 h-5 w-5" />
              Custom Timer
            </TabsTrigger>
            <TabsTrigger value="pomodoro" className="data-[state=active]:bg-primary/10">
              <Brain className="mr-2 h-5 w-5" />
              Pomodoro
            </TabsTrigger>
          </TabsList>
          <TabsContent value="custom">
            <CustomTimer initialMinutes={suggestedDuration} />
          </TabsContent>
          <TabsContent value="pomodoro">
            <PomodoroTimer />
          </TabsContent>
        </Tabs>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Focus className="h-5 w-5" />
              <h3 className="text-lg font-medium">Focus Mode</h3>
            </div>
            <FocusMode />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart className="h-5 w-5" />
            <h3 className="text-lg font-medium">Time Analytics</h3>
          </div>
          <TimeAnalytics />
        </div>
      </Card>
    </div>
  );
};

export default TimeManagement;