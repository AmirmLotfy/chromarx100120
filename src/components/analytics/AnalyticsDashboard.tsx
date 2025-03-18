import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import ProductivityScore from "./ProductivityScore";
import TimeDistribution from "./TimeDistribution";
import DomainStats from "./DomainStats";
import ProductivityTrends from "./ProductivityTrends";
import { getAnalyticsData } from "@/utils/analyticsUtils";
import { AnalyticsData } from "@/types/analytics";
import AnalyticsFilters, { AnalyticsFilters as FilterType } from "./AnalyticsFilters";
import { toast } from "sonner";
import GoalsDashboard from "./GoalsDashboard";
import ProductivityReports from "./ProductivityReports";
import ProductivityNotifications from "./ProductivityNotifications";
import { withErrorHandling } from "@/utils/errorUtils";
import { validateAnalyticsData } from "@/utils/validationUtils";
import { cache } from "@/utils/cacheUtils";
import { localBackup } from "@/services/localBackupService";
import { motion } from "framer-motion";
import { Download, Filter, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showMoreInsights, setShowMoreInsights] = useState(false);
  const [dateRange, setDateRange] = useState({ 
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date() 
  });
  const [filters, setFilters] = useState<FilterType>({
    domains: [],
    categories: []
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const cacheKey = `analytics_${dateRange.from.toISOString()}_${dateRange.to.toISOString()}`;
        const analyticsData = await cache.primeCache(cacheKey, async () => {
          const data = await getAnalyticsData();
          return validateAnalyticsData(data);
        });

        setData(analyticsData);
        
        localBackup.syncAll().catch(console.error);
      } catch (error) {
        console.error("Error loading analytics data:", error);
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dateRange, filters]);

  const handleExport = useCallback(() => {
    const exportData = async () => {
      try {
        if (!data) return;
        
        const csvContent = [
          ["Date", "Productivity Score", "Total Time", "Domain", "Time Spent", "Category"].join(","),
          ...data.domainStats.map(stat => 
            [
              new Date().toISOString().split('T')[0],
              data.productivityScore,
              stat.timeSpent,
              stat.domain,
              stat.visits,
              "Work"
            ].join(",")
          )
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", `analytics_export_${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        toast.success("Analytics data exported successfully!");
      } catch (error) {
        console.error('Error exporting data:', error);
        toast.error("Failed to export analytics data");
      }
    };

    exportData();
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="w-full h-32 animate-pulse bg-muted/50" />
        ))}
      </div>
    );
  }

  const filteredData = data ? {
    ...data,
    domainStats: data.domainStats.filter(stat => {
      if (filters.domains.length && !filters.domains.includes(stat.domain)) return false;
      if (filters.minProductivity && calculateDomainScore(stat) < filters.minProductivity) return false;
      return true;
    })
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Your Activity</h2>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2.5 text-xs rounded-full"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Filters
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2.5 text-xs rounded-full"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </div>
      
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <Card className="p-3 bg-muted/30 border border-muted mb-4">
            <AnalyticsFilters
              onDateChange={setDateRange}
              onFilterChange={setFilters}
              onExport={handleExport}
            />
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="col-span-2 md:col-span-1"
        >
          <ProductivityScore score={filteredData?.productivityScore || 0} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="col-span-2 md:col-span-1"
        >
          <TimeDistribution data={filteredData?.timeDistribution || []} />
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <ProductivityTrends data={filteredData?.productivityTrends || []} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <DomainStats data={filteredData?.domainStats || []} />
      </motion.div>
      
      <div className="my-6">
        <Button 
          variant="ghost" 
          className="w-full justify-between py-6 rounded-xl border border-border/50"
          onClick={() => setShowMoreInsights(!showMoreInsights)}
        >
          <span className="text-base font-medium">More Insights</span>
          <ChevronDown className={`h-5 w-5 transition-transform ${showMoreInsights ? 'rotate-180' : ''}`} />
        </Button>
      </div>
      
      {showMoreInsights && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6 overflow-hidden"
        >
          <GoalsDashboard />
          <ProductivityReports />
          <ProductivityNotifications />
        </motion.div>
      )}
    </div>
  );
};

const calculateDomainScore = (stat: { timeSpent: number; visits: number }) => {
  const avgTimePerVisit = stat.timeSpent / stat.visits;
  const optimalTimePerVisit = 10 * 60 * 1000;
  return Math.min(100, Math.round((optimalTimePerVisit / avgTimePerVisit) * 100));
};

export default AnalyticsDashboard;
