import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { getHistoryData } from "@/utils/analyticsUtils";
import { VisitData } from "@/types/analytics";

interface DomainStatsProps {
  detailed?: boolean;
}

const DomainStats = ({ detailed = false }: DomainStatsProps) => {
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const startTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const historyData = await getHistoryData(startTime);
      setVisits(historyData.sort((a, b) => b.visitCount - a.visitCount));
      setLoading(false);
    };

    fetchData();
  }, []);

  // Modern color palette inspired by Material You
  const colors = ["#7E57C2", "#5C6BC0", "#42A5F5", "#26C6DA"];

  const chartData = visits.slice(0, 4).map((visit, index) => ({
    name: visit.domain,
    value: visit.visitCount,
    color: colors[index]
  }));

  if (loading) {
    return (
      <Card className="p-6 w-full">
        <div className="text-center">Loading domain statistics...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6 w-full bg-gradient-to-br from-background to-muted shadow-lg">
      <div className="space-y-3">
        <h3 className="text-xl font-semibold tracking-tight">Domain Distribution</h3>
        <p className="text-sm text-muted-foreground">Your most visited websites</p>
      </div>
      
      <div className="flex justify-center items-center h-[300px] mt-6 sm:h-[400px] md:h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={8}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  strokeWidth={2}
                  stroke="var(--background)"
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                opacity: 1
              }}
              itemStyle={{
                color: 'var(--foreground)'
              }}
              cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={48}
              formatter={(value) => <span className="text-sm font-medium">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {detailed && visits.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-xl border border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead className="font-semibold">Domain</TableHead>
                <TableHead className="text-right font-semibold">Visits</TableHead>
                <TableHead className="text-right font-semibold">Time Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.slice(0, 10).map((visit) => (
                <TableRow key={visit.domain} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{visit.domain}</TableCell>
                  <TableCell className="text-right">{visit.visitCount}</TableCell>
                  <TableCell className="text-right">{Math.round(visit.timeSpent)} min</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};

export default DomainStats;