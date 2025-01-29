import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductivityScore from "./ProductivityScore";
import DomainStats from "./DomainStats";
import TimeDistribution from "./TimeDistribution";
import ProductivityTrends from "./ProductivityTrends";
import AITips from "./AITips";

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="time">Time</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="tips">AI Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ProductivityScore />
          <DomainStats />
        </TabsContent>

        <TabsContent value="domains">
          <DomainStats detailed />
        </TabsContent>

        <TabsContent value="time">
          <TimeDistribution />
        </TabsContent>

        <TabsContent value="trends">
          <ProductivityTrends />
        </TabsContent>

        <TabsContent value="tips">
          <AITips />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;