import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomTimer from "./CustomTimer";
import PomodoroTimer from "./PomodoroTimer";
import FocusMode from "./FocusMode";
import TimeAnalytics from "./TimeAnalytics";

const TimeManagement = () => {
  return (
    <Tabs defaultValue="custom" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="custom">Custom Timer</TabsTrigger>
        <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
        <TabsTrigger value="focus">Focus Mode</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>
      
      <TabsContent value="custom" className="space-y-4">
        <CustomTimer />
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
  );
};

export default TimeManagement;