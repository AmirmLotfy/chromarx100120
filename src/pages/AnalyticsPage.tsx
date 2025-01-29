import Layout from "@/components/Layout";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

const AnalyticsPage = () => {
  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track your browsing habits and improve productivity
        </p>
        <AnalyticsDashboard />
      </div>
    </Layout>
  );
};

export default AnalyticsPage;