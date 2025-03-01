
import Layout from "@/components/Layout";
import { BarChart3, BarChart, LineChart, PieChart } from "lucide-react";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import AITips from "@/components/analytics/AITips";
import TaskAnalytics from "@/components/tasks/TaskAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

const AnalyticsPage = () => {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-background/80">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <h1 className="font-bold tracking-tight text-xl">Analytics</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-10">
              Track and optimize your productivity with detailed insights
            </p>
          </motion.div>

          <ScrollArea className="h-[calc(100vh-10rem)]">
            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-10 rounded-full p-1 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger value="dashboard" className="rounded-full text-xs">Dashboard</TabsTrigger>
                <TabsTrigger value="tasks" className="rounded-full text-xs">Tasks</TabsTrigger>
                <TabsTrigger value="insights" className="rounded-full text-xs">AI Insights</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard" className="mt-4 space-y-4 pb-10">
                <AnalyticsDashboard />
              </TabsContent>
              
              <TabsContent value="tasks" className="mt-4 space-y-4 pb-10">
                <TaskAnalytics />
              </TabsContent>
              
              <TabsContent value="insights" className="mt-4 space-y-4 pb-10">
                <AITips />
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
