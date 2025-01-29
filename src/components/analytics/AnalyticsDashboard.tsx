import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProductivityScore from "./ProductivityScore";
import DomainStats from "./DomainStats";
import TimeDistribution from "./TimeDistribution";
import ProductivityTrends from "./ProductivityTrends";
import AITips from "./AITips";

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="time">Time</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="tips">AI Tips</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-20rem)]">
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