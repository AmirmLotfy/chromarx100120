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
  const data = [
    { name: "Mon", work: 4, social: 2, entertainment: 1 },
    { name: "Tue", work: 5, social: 1, entertainment: 2 },
    { name: "Wed", work: 3, social: 3, entertainment: 1 },
    { name: "Thu", work: 6, social: 1, entertainment: 1 },
    { name: "Fri", work: 4, social: 2, entertainment: 2 },
  ];

  return (
    <Card className="p-4 w-full">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Time Distribution</h3>
        <p className="text-sm text-muted-foreground">Your daily browsing patterns</p>
      </div>
      
      <div className="h-[300px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
    </Card>
  );
};

export default TimeDistribution;