import Layout from "@/components/Layout";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

const AnalyticsPage = () => {
  return (
    <Layout>
      <div className="h-[calc(100vh-10rem)] flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your browsing habits and improve productivity
          </p>
        </div>
        <div className="flex-1">
          <AnalyticsDashboard />
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;