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
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const renderContent = () => (
    <ScrollArea className="h-[calc(100vh-16rem)] px-4 md:px-6">
      <div className="space-y-6">
        {activeTab === "custom" && (
          <div className="space-y-6">
            <AITimerSuggestions onSuggestion={handleAISuggestion} />
            <CustomTimer initialMinutes={suggestedDuration} />
          </div>
        )}
        {activeTab === "pomodoro" && <PomodoroTimer />}
        {activeTab === "focus" && <FocusMode />}
        {activeTab === "analytics" && <TimeAnalytics />}
      </div>
    </ScrollArea>
  );

  return (
    <div className="space-y-6">
      {isMobile ? (
        <div className="space-y-6">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full h-12 text-lg bg-background border-input">
              <SelectValue placeholder="Select timer type" />
            </SelectTrigger>
            <SelectContent className="bg-background border-2 shadow-lg">
              {tabs.map((tab) => (
                <SelectItem 
                  key={tab.value} 
                  value={tab.value}
                  className="h-12 text-lg hover:bg-accent focus:bg-accent"
                >
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {renderContent()}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-14">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="text-base data-[state=active]:text-primary"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {renderContent()}
        </Tabs>
      )}
    </div>
  );
};

export default TimeManagement;