import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ProductivityTrends = () => {
  const data = [
    { date: "Mon", score: 65 },
    { date: "Tue", score: 70 },
    { date: "Wed", score: 68 },
    { date: "Thu", score: 75 },
    { date: "Fri", score: 72 },
  ];

  return (
    <Card className="p-4 w-full">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Productivity Trends</h3>
        <p className="text-sm text-muted-foreground">Your productivity score over time</p>
      </div>
      
      <div className="h-[300px] mt-4 -mx-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#9b87f5"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ProductivityTrends;