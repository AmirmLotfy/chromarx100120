import Layout from "@/components/Layout";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

const AnalyticsPage = () => {
  return (
    <Layout>
      <div className="h-full space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your browsing habits and improve productivity
          </p>
        </div>
        <AnalyticsDashboard />
      </div>
    </Layout>
  );
};

export default AnalyticsPage;