import Layout from "@/components/Layout";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

const AnalyticsPage = () => {
  return (
    <Layout>
      <div className="space-y-6 px-4 md:px-6 pb-20 md:pb-6 pt-6 md:pt-8">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Track your browsing habits and improve productivity
          </p>
        </div>
        <AnalyticsDashboard />
      </div>
    </Layout>
  );
};

export default AnalyticsPage;