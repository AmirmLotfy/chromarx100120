import Layout from "@/components/Layout";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { ChartBar } from "lucide-react";

const AnalyticsPage = () => {
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto px-4 py-6 min-h-[calc(100vh-4rem)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ChartBar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Track and improve your browsing productivity
            </p>
          </div>
        </div>
        <AnalyticsDashboard />
      </div>
    </Layout>
  );
};

export default AnalyticsPage;