
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
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (!isMobile) return null; // Don't show labels on mobile
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return percent > 0.1 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <Card className="p-4 space-y-2 h-full rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/30">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">Time Distribution</h3>
      </div>

      <div className="h-[140px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 30 : 40}
              outerRadius={isMobile ? 50 : 65}
              paddingAngle={2}
              dataKey="time"
              label={renderCustomizedLabel}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatTime(value)}
              labelFormatter={(index) => data[index].category}
              contentStyle={{ 
                borderRadius: '8px', 
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: 'none',
                padding: '8px 12px',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-xs truncate">{entry.category}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TimeDistribution;
