import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ChartBar, TrendingUp, Signal, Info } from "lucide-react";
import ProductivityScore from "./ProductivityScore";
import DomainStats from "./DomainStats";
import TimeDistribution from "./TimeDistribution";
import ProductivityTrends from "./ProductivityTrends";
import AITips from "./AITips";

const AnalyticsDashboard = () => {
  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-4 px-2 pb-8">
        {/* AI Tips - Moved to top for better visibility */}
        <AITips />

        {/* Overview Cards */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/10 dark:to-purple-800/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Productivity Overview</h3>
                <p className="text-xs text-muted-foreground">Real-time insights into your browsing habits</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Analytics Components */}
        <div className="space-y-4">
          <ProductivityScore />
          <TimeDistribution />
          <DomainStats detailed={true} />
          <ProductivityTrends />
        </div>
      </div>
    </ScrollArea>
  );
};

export default AnalyticsDashboard;