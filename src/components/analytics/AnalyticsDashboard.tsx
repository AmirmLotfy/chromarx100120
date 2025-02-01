import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductivityScore from "./ProductivityScore";
import DomainStats from "./DomainStats";
import TimeDistribution from "./TimeDistribution";
import ProductivityTrends from "./ProductivityTrends";
import AITips from "./AITips";

const AnalyticsDashboard = () => {
  const [activeView, setActiveView] = useState("overview");
  const isMobile = useIsMobile();

  const views = [
    { value: "overview", label: "Overview" },
    { value: "domains", label: "Domains" },
    { value: "time", label: "Time Analysis" },
    { value: "trends", label: "Trends" },
    { value: "tips", label: "AI Tips" },
  ];

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return (
          <div className="space-y-6">
            <ProductivityScore />
            <DomainStats />
          </div>
        );
      case "domains":
        return <DomainStats detailed />;
      case "time":
        return <TimeDistribution />;
      case "trends":
        return <ProductivityTrends />;
      case "tips":
        return <AITips />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Select value={activeView} onValueChange={setActiveView}>
        <SelectTrigger className="w-full h-12 text-lg bg-background border-input">
          <SelectValue placeholder="Select view" />
        </SelectTrigger>
        <SelectContent className="bg-background border-2 shadow-lg">
          {views.map((view) => (
            <SelectItem 
              key={view.value} 
              value={view.value}
              className="h-12 text-lg hover:bg-accent focus:bg-accent"
            >
              {view.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ScrollArea className="h-[calc(100vh-16rem)]">
        {renderContent()}
      </ScrollArea>
    </div>
  );
};

export default AnalyticsDashboard;