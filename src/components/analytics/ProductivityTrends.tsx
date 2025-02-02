import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ProductivityTrend } from "@/types/analytics";

interface ProductivityTrendsProps {
  data: ProductivityTrend[];
}

const ProductivityTrends = ({ data }: ProductivityTrendsProps) => {
  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Productivity Trends</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ProductivityTrends;