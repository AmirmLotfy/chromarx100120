import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const TimeAnalytics = () => {
  // Sample data - in a real implementation, this would come from actual user data
  const data = [
    { name: "Mon", minutes: 120 },
    { name: "Tue", minutes: 150 },
    { name: "Wed", minutes: 180 },
    { name: "Thu", minutes: 135 },
    { name: "Fri", minutes: 160 },
    { name: "Sat", minutes: 90 },
    { name: "Sun", minutes: 75 },
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Time Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Your focused time this week
          </p>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="minutes" fill="#9b87f5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};

export default TimeAnalytics;