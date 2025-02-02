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
  Legend
} from "recharts";
import { getHistoryData } from "@/utils/analyticsUtils";
import { format, subDays } from "date-fns";
import { VisitData } from "@/types/analytics";

const TimeDistribution = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const timeData = [];
        for (let i = 6; i >= 0; i--) {
          const endTime = Date.now() - (i * 24 * 60 * 60 * 1000);
          const startTime = endTime - (24 * 60 * 60 * 1000);
          const historyData = await getHistoryData(startTime);
          
          const dayData = {
            name: format(subDays(new Date(), i), 'EEE'),
            work: 0,
            social: 0,
            entertainment: 0
          };

          historyData.forEach((visit: VisitData) => {
            const domain = visit.domain.toLowerCase();
            if (domain.includes('github.com') || domain.includes('docs.') || 
                domain.includes('stackoverflow.com') || domain.includes('learn')) {
              dayData.work += visit.timeSpent;
            } else if (domain.includes('facebook.com') || domain.includes('twitter.com') || 
                     domain.includes('instagram.com') || domain.includes('linkedin.com')) {
              dayData.social += visit.timeSpent;
            } else {
              dayData.entertainment += visit.timeSpent;
            }
          });

          timeData.push(dayData);
        }
        
        setData(timeData);
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
      <Card className="p-6">
        <div className="text-center">Loading time distribution...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6 w-full bg-gradient-to-br from-background to-muted shadow-lg">
      <div className="space-y-3">
        <h3 className="text-xl font-semibold tracking-tight">Time Distribution</h3>
        <p className="text-sm text-muted-foreground">Your daily browsing patterns</p>
      </div>
      
      <div className="flex justify-center items-center h-[300px] mt-6 sm:h-[400px] md:h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              dataKey="name" 
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
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
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                opacity: 1
              }}
              itemStyle={{
                color: 'var(--foreground)'
              }}
              cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
            />
            <Legend 
              verticalAlign="top"
              height={36}
              formatter={(value) => <span className="text-sm font-medium capitalize">{value}</span>}
            />
            <Bar 
              dataKey="work" 
              fill="#7E57C2" 
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar 
              dataKey="social" 
              fill="#5C6BC0" 
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar 
              dataKey="entertainment" 
              fill="#42A5F5" 
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