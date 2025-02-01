import Layout from "@/components/Layout";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

const AnalyticsPage = () => {
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto px-4 py-6 min-h-[calc(100vh-4rem)] space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your browsing habits and improve productivity
          </p>
        </div>
        <AnalyticsDashboard />
      </div>
    </Layout>
  );
};

export default AnalyticsPage;