import { ScrollArea } from "@/components/ui/scroll-area";
import ProductivityScore from "./ProductivityScore";
import DomainStats from "./DomainStats";
import TimeDistribution from "./TimeDistribution";
import ProductivityTrends from "./ProductivityTrends";
import AITips from "./AITips";

const AnalyticsDashboard = () => {
  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-6">
        <ProductivityScore />
        <DomainStats />
        <TimeDistribution />
        <ProductivityTrends />
        <AITips />
      </div>
    </ScrollArea>
  );
};

export default AnalyticsDashboard;