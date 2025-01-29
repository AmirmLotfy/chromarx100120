import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("overview");
  const isMobile = useIsMobile();

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "domains", label: "Domains" },
    { value: "time", label: "Time" },
    { value: "trends", label: "Trends" },
    { value: "tips", label: "AI Tips" },
  ];

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <Card className="mb-4 p-1">
          {isMobile ? (
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full bg-background border-input">
                <SelectValue placeholder="Select view" />
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
          ) : (
            <TabsList className="w-full justify-start">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          )}
        </Card>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-22rem)]">
            <div className="space-y-4 pr-4 pb-8">
              <TabsContent value="overview" className="mt-0 space-y-4">
                <ProductivityScore />
                <DomainStats />
              </TabsContent>

              <TabsContent value="domains" className="mt-0">
                <DomainStats detailed />
              </TabsContent>

              <TabsContent value="time" className="mt-0">
                <TimeDistribution />
              </TabsContent>

              <TabsContent value="trends" className="mt-0">
                <ProductivityTrends />
              </TabsContent>

              <TabsContent value="tips" className="mt-0">
                <AITips />
              </TabsContent>
            </div>
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;