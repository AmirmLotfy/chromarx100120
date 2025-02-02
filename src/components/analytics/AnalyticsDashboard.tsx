import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import ProductivityScore from "./ProductivityScore";
import TimeDistribution from "./TimeDistribution";
import DomainStats from "./DomainStats";
import ProductivityTrends from "./ProductivityTrends";
import { getAnalyticsData } from "@/utils/analyticsUtils";
import { AnalyticsData } from "@/types/analytics";

const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const analyticsData = await getAnalyticsData();
        setData(analyticsData);
      } catch (error) {
        console.error("Error loading analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="w-full h-[200px] animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ProductivityScore score={data?.productivityScore || 0} />
        <TimeDistribution data={data?.timeDistribution || []} />
        <DomainStats data={data?.domainStats || []} />
        <ProductivityTrends data={data?.productivityTrends || []} />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;