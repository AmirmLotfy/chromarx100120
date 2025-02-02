import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { getHistoryData, calculateProductivityScore } from "@/utils/analyticsUtils";
import { format, subDays } from "date-fns";

const ProductivityTrends = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trends = [];
        for (let i = 6; i >= 0; i--) {
          const endTime = Date.now() - (i * 24 * 60 * 60 * 1000);
          const startTime = endTime - (24 * 60 * 60 * 1000);
          const historyData = await getHistoryData(startTime);
          const score = calculateProductivityScore(historyData);
          
          trends.push({
            date: format(subDays(new Date(), i), 'EEE'),
            score
          });
        }
        
        setData(trends);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching productivity trends:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading productivity trends...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6 w-full bg-gradient-to-br from-background to-muted shadow-lg">
      <div className="space-y-3">
        <h3 className="text-xl font-semibold tracking-tight">Productivity Trends</h3>
        <p className="text-sm text-muted-foreground">Your productivity score over time</p>
      </div>
      
      <div className="flex justify-center items-center h-[300px] mt-6 sm:h-[400px] md:h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              dataKey="date" 
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              cursor={{ stroke: 'var(--muted)' }}
            />
            <Legend 
              verticalAlign="top"
              height={36}
              formatter={(value) => <span className="text-sm font-medium capitalize">{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="score"
              name="Productivity"
              stroke="#7E57C2"
              strokeWidth={3}
              dot={{ fill: "#7E57C2", strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: "#7E57C2" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ProductivityTrends;