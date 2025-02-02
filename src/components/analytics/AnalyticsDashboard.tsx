import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import ProductivityScore from "./ProductivityScore";
import DomainStats from "./DomainStats";
import TimeDistribution from "./TimeDistribution";
import ProductivityTrends from "./ProductivityTrends";
import AITips from "./AITips";

const AnalyticsDashboard = () => {
  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-4 px-4 pb-8 max-w-[100vw] overflow-x-hidden">
        {/* Overview Card */}
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

        {/* AI Tips - Moved to top for better visibility */}
        <div className="w-full">
          <AITips />
        </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 gap-4">
          <div className="w-full">
            <ProductivityScore />
          </div>
          <div className="w-full">
            <TimeDistribution />
          </div>
          <div className="w-full">
            <DomainStats detailed={true} />
          </div>
          <div className="w-full">
            <ProductivityTrends />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default AnalyticsDashboard;