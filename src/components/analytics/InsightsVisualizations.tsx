
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CircularProgress } from "@/components/ui/progress";

interface InsightsVisualizationsProps {
  productivityByDomain: Array<{ domain: string; score: number }>;
  goalProgress: Array<{ category: string; current: number; target: number }>;
}

const InsightsVisualizations = ({ productivityByDomain, goalProgress }: InsightsVisualizationsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-4">
        <h3 className="font-medium mb-4">Domain Productivity</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productivityByDomain}>
              <XAxis dataKey="domain" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-medium mb-4">Goal Progress</h3>
        <div className="grid grid-cols-2 gap-4">
          {goalProgress.map((goal, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="relative w-24 h-24">
                <CircularProgress 
                  value={(goal.current / goal.target) * 100}
                  size={96}
                  strokeWidth={8}
                />
                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-medium">
                  {Math.round((goal.current / goal.target) * 100)}%
                </span>
              </div>
              <span className="text-sm text-muted-foreground mt-2">{goal.category}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default InsightsVisualizations;
