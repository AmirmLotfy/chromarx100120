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
import { supabaseBackup } from "@/services/supabaseBackupService";

const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
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
        
        supabaseBackup.syncAll().catch(console.error);
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="w-full h-[200px] animate-pulse bg-muted" />
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
    <div className="space-y-8">
      <AnalyticsFilters
        onDateChange={setDateRange}
        onFilterChange={setFilters}
        onExport={handleExport}
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ProductivityScore score={filteredData?.productivityScore || 0} />
        <TimeDistribution data={filteredData?.timeDistribution || []} />
        <DomainStats data={filteredData?.domainStats || []} />
        <ProductivityTrends data={filteredData?.productivityTrends || []} />
      </div>

      <div className="grid gap-8">
        <GoalsDashboard />
        <ProductivityReports />
        <ProductivityNotifications />
      </div>
    </div>
  );
};

const calculateDomainScore = (stat: { timeSpent: number; visits: number }) => {
  const avgTimePerVisit = stat.timeSpent / stat.visits;
  const optimalTimePerVisit = 10 * 60 * 1000;
  return Math.min(100, Math.round((optimalTimePerVisit / avgTimePerVisit) * 100));
};

export default AnalyticsDashboard;
