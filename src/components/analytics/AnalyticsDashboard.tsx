import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import ProductivityScore from "./ProductivityScore";
import DomainStats from "./DomainStats";
import TimeDistribution from "./TimeDistribution";
import ProductivityTrends from "./ProductivityTrends";
import AITips from "./AITips";

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const isMobile = useIsMobile();

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <Card className="mb-4 p-1">
          <TabsList className={`w-full ${isMobile ? 'flex flex-wrap gap-1' : 'justify-start'}`}>
            <TabsTrigger 
              value="overview" 
              className={`${isMobile ? 'flex-1 min-w-[calc(50%-0.125rem)]' : ''}`}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="domains"
              className={`${isMobile ? 'flex-1 min-w-[calc(50%-0.125rem)]' : ''}`}
            >
              Domains
            </TabsTrigger>
            <TabsTrigger 
              value="time"
              className={`${isMobile ? 'flex-1 min-w-[calc(50%-0.125rem)]' : ''}`}
            >
              Time
            </TabsTrigger>
            <TabsTrigger 
              value="trends"
              className={`${isMobile ? 'flex-1 min-w-[calc(50%-0.125rem)]' : ''}`}
            >
              Trends
            </TabsTrigger>
            <TabsTrigger 
              value="tips"
              className={`${isMobile ? 'flex-1 min-w-[calc(50%-0.125rem)]' : ''}`}
            >
              AI Tips
            </TabsTrigger>
          </TabsList>
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