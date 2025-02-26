
import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Brain, ChartLine, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AIInsight {
  summary: string;
  patterns: string[];
  recommendations: string[];
  alerts: string[];
  domainSpecificTips: Record<string, string>;
}

const AITips = () => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [realtimeData, setRealtimeData] = useState<any>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        // Get last 7 days of analytics data
        const { data: analyticsData, error } = await supabase
          .from('analytics_data')
          .select('*')
          .order('date', { ascending: false })
          .limit(7);

        if (error) throw error;

        // Get AI insights using the edge function
        const { data: insightData, error: insightError } = await supabase.functions
          .invoke('analyze-productivity', {
            body: { 
              analyticsData,
              timeframe: '7days'
            }
          });

        if (insightError) throw insightError;
        
        setInsights(insightData.insights);
      } catch (error) {
        console.error('Error fetching insights:', error);
        toast.error('Failed to load insights');
      } finally {
        setLoading(false);
      }
    };

    // Set up real-time subscription
    const channel = supabase
      .channel('analytics-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_data'
        },
        (payload) => {
          setRealtimeData(payload.new);
          toast.info('New analytics data available');
        }
      )
      .subscribe();

    fetchInsights();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realtimeData]); // Refetch when new data arrives

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }

  if (!insights) {
    return (
      <Alert>
        <AlertDescription>
          Start browsing to get personalized insights!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-4 p-1">
        {/* Summary Card */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Overview</h3>
          </div>
          <p className="text-sm text-muted-foreground">{insights.summary}</p>
        </Card>

        {/* Patterns Card */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ChartLine className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Identified Patterns</h3>
          </div>
          <div className="space-y-2">
            {insights.patterns.map((pattern, index) => (
              <div key={index} className="text-sm text-muted-foreground">
                • {pattern}
              </div>
            ))}
          </div>
        </Card>

        {/* Alerts Card */}
        {insights.alerts.length > 0 && (
          <Card className="p-4 border-yellow-500">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-yellow-500" />
              <h3 className="font-medium">Alerts</h3>
            </div>
            <div className="space-y-2">
              {insights.alerts.map((alert, index) => (
                <Alert key={index}>
                  <AlertDescription>{alert}</AlertDescription>
                </Alert>
              ))}
            </div>
          </Card>
        )}

        {/* Recommendations Card */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Recommendations</h3>
          </div>
          <div className="space-y-2">
            {insights.recommendations.map((recommendation, index) => (
              <div key={index} className="text-sm text-muted-foreground">
                • {recommendation}
              </div>
            ))}
          </div>
        </Card>

        {/* Domain-specific Tips */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">Domain-Specific Tips</h3>
          <div className="space-y-3">
            {Object.entries(insights.domainSpecificTips).map(([domain, tip]) => (
              <div key={domain} className="space-y-1">
                <Badge variant="outline">{domain}</Badge>
                <p className="text-sm text-muted-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default AITips;
