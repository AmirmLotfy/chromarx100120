import Layout from "@/components/Layout";
import { ChartBar } from "lucide-react";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import AITips from "@/components/analytics/AITips";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const AnalyticsPage = () => {
  return <Layout>
      <div className="container max-w-7xl mx-auto px-4 py-6 min-h-[calc(100vh-4rem)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ChartBar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold tracking-tight text-base">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Track and optimize your browsing productivity
            </p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>
          <TabsContent value="insights" className="space-y-4">
            <AITips />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>;
};
export default AnalyticsPage;