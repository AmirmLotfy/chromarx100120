import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getHistoryData } from "@/utils/analyticsUtils";
import { format } from "date-fns";

const TimeDistribution = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get last 7 days of history
        const startTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const historyData = await getHistoryData(startTime);
        
        // Group data by day and category
        const groupedData = historyData.reduce((acc: any, visit) => {
          const day = format(new Date(visit.lastVisitTime), 'EEE');
          if (!acc[day]) {
            acc[day] = { work: 0, social: 0, entertainment: 0 };
          }
          
          // Categorize domains
          if (visit.domain.includes('github.com') || visit.domain.includes('docs.') || visit.domain.includes('stackoverflow.com')) {
            acc[day].work += visit.timeSpent;
          } else if (visit.domain.includes('facebook.com') || visit.domain.includes('twitter.com') || visit.domain.includes('instagram.com')) {
            acc[day].social += visit.timeSpent;
          } else {
            acc[day].entertainment += visit.timeSpent;
          }
          return acc;
        }, {});

        // Convert to array format for Recharts
        const chartData = Object.entries(groupedData).map(([name, values]: [string, any]) => ({
          name,
          ...values
        }));

        setData(chartData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching time distribution:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center">Loading time distribution...</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 w-full bg-gradient-to-br from-background to-muted">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Time Distribution</h3>
        <p className="text-sm text-muted-foreground">Your daily browsing patterns</p>
      </div>
      
      <div className="flex justify-center items-center h-[300px] mt-4 md:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              dataKey="name" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Math.round(value)}m`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '8px'
              }}
            />
            <Bar 
              dataKey="work" 
              fill="var(--primary-color)" 
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar 
              dataKey="social" 
              fill="var(--secondary-color)" 
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar 
              dataKey="entertainment" 
              fill="var(--accent-color)" 
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TimeDistribution;