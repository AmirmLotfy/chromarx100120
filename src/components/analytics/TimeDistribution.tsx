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

const TimeDistribution = () => {
  // This would be actual time distribution data
  const data = [
    { name: "Mon", work: 4, social: 2, entertainment: 1 },
    { name: "Tue", work: 5, social: 1, entertainment: 2 },
    { name: "Wed", work: 3, social: 3, entertainment: 1 },
    { name: "Thu", work: 6, social: 1, entertainment: 1 },
    { name: "Fri", work: 4, social: 2, entertainment: 2 },
  ];

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Time Distribution</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="work" fill="#9b87f5" stackId="a" />
              <Bar dataKey="social" fill="#7E69AB" stackId="a" />
              <Bar dataKey="entertainment" fill="#E5DEFF" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};

export default TimeDistribution;