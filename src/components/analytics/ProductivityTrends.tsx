
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { ProductivityTrend } from "@/types/analytics";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductivityTrendsProps {
  data: ProductivityTrend[];
}

const ProductivityTrends = ({ data }: ProductivityTrendsProps) => {
  const isMobile = useIsMobile();
  
  const formatXAxis = (value: string) => {
    // For mobile, show shorter date format
    if (isMobile) {
      const date = new Date(value);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }
    return value;
  };

  return (
    <Card className="p-4 space-y-3 rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/30">
      <h3 className="text-sm font-medium text-muted-foreground">Productivity Trends</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
              tickCount={5}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              formatter={(value) => [`${value}%`, 'Productivity']}
              contentStyle={{ 
                borderRadius: '8px', 
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: 'none',
                padding: '8px 12px',
                fontSize: '12px'
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 1, fill: '#10B981' }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ProductivityTrends;
