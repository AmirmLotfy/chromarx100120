
import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AITips = () => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    const getInsights = async () => {
      try {
        // Get last 7 days of analytics data
        const { data: analyticsData, error } = await supabase
          .from('analytics_data')
          .select('*')
          .order('date', { ascending: false })
          .limit(7);

        if (error) throw error;

        // Get user's goals
        const { data: goals } = await supabase
          .from('analytics_goals')
          .select('*')
          .gt('end_date', new Date().toISOString());

        // Generate insights based on the data
        const generatedInsights = [];

        if (analyticsData && analyticsData.length > 0) {
          const avgScore = analyticsData.reduce((sum, day) => sum + day.productivity_score, 0) / analyticsData.length;
          generatedInsights.push(`Your average productivity score for the last 7 days is ${Math.round(avgScore)}%`);

          // Add more insights based on patterns
          const timeSpentTrend = analyticsData.map(day => day.total_time_spent);
          const increasing = timeSpentTrend.every((val, i) => i === 0 || val >= timeSpentTrend[i - 1]);
          
          if (increasing) {
            generatedInsights.push("Your daily browsing time has been increasing. Consider setting time management goals.");
          }

          // Add goals-related insights
          if (goals && goals.length > 0) {
            goals.forEach(goal => {
              const progress = (goal.current_hours / goal.target_hours) * 100;
              generatedInsights.push(`You're ${Math.round(progress)}% toward your ${goal.category} goal.`);
            });
          }
        }

        setInsights(generatedInsights.length > 0 ? generatedInsights : ["Start browsing to get personalized insights!"]);
      } catch (error) {
        console.error('Error fetching insights:', error);
        toast.error('Failed to load insights');
        setInsights(['Unable to load insights. Please try again later.']);
      } finally {
        setLoading(false);
      }
    };

    getInsights();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <Card key={index} className="p-4">
          <p className="text-sm text-muted-foreground">{insight}</p>
        </Card>
      ))}
    </div>
  );
};

export default AITips;
