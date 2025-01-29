import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomTimer from "./CustomTimer";
import PomodoroTimer from "./PomodoroTimer";
import FocusMode from "./FocusMode";
import TimeAnalytics from "./TimeAnalytics";
import AITimerSuggestions from "./AITimerSuggestions";
import { useIsMobile } from "@/hooks/use-mobile";

const TimeManagement = () => {
  const [activeTab, setActiveTab] = useState("custom");
  const [suggestedDuration, setSuggestedDuration] = useState<number | null>(null);
  const isMobile = useIsMobile();

  const handleAISuggestion = (duration: number) => {
    setSuggestedDuration(duration);
  };

  const tabs = [
    { value: "custom", label: "Custom Timer" },
    { value: "pomodoro", label: "Pomodoro" },
    { value: "focus", label: "Focus Mode" },
    { value: "analytics", label: "Analytics" },
  ];

  return (
    <div className="space-y-4">
      {isMobile ? (
        <div className="space-y-6">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full bg-background border-input">
              <SelectValue placeholder="Select timer type" />
            </SelectTrigger>
            <SelectContent className="bg-background border-2 shadow-lg">
              {tabs.map((tab) => (
                <SelectItem 
                  key={tab.value} 
                  value={tab.value}
                  className="hover:bg-accent focus:bg-accent"
                >
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="pt-2">
            {activeTab === "custom" && (
              <div className="space-y-4">
                <AITimerSuggestions onSuggestion={handleAISuggestion} />
                <CustomTimer initialMinutes={suggestedDuration} />
              </div>
            )}
            {activeTab === "pomodoro" && <PomodoroTimer />}
            {activeTab === "focus" && <FocusMode />}
            {activeTab === "analytics" && <TimeAnalytics />}
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="custom" className="space-y-4">
            <AITimerSuggestions onSuggestion={handleAISuggestion} />
            <CustomTimer initialMinutes={suggestedDuration} />
          </TabsContent>
          
          <TabsContent value="pomodoro" className="space-y-4">
            <PomodoroTimer />
          </TabsContent>
          
          <TabsContent value="focus" className="space-y-4">
            <FocusMode />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <TimeAnalytics />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default TimeManagement;