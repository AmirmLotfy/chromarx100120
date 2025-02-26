
"use client";

import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TimeDistributionData } from "@/types/analytics";
import { useIsMobile } from "@/hooks/use-mobile";

interface TimeDistributionProps {
  data: TimeDistributionData[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const TimeDistribution = ({ data }: TimeDistributionProps) => {
  const isMobile = useIsMobile();
  
  const formatTime = (time: number) => {
    const hours = Math.floor(time / (60 * 60 * 1000));
    const minutes = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="p-4 md:p-6 space-y-3 w-full">
      <h3 className="text-base md:text-lg font-semibold">Time Distribution</h3>
      <div className="h-[200px] md:h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 40 : 60}
              outerRadius={isMobile ? 60 : 80}
              paddingAngle={5}
              dataKey="time"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatTime(value)}
              labelFormatter={(index) => data[index].category}
            />
            <Legend
              layout={isMobile ? "horizontal" : "vertical"}
              align={isMobile ? "center" : "right"}
              verticalAlign={isMobile ? "bottom" : "middle"}
              wrapperStyle={isMobile ? { fontSize: '12px' } : { fontSize: '14px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TimeDistribution;
