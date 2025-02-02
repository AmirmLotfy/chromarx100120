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

  const colors = ["#9b87f5", "#7E69AB", "#E5DEFF", "#F1F0FB"];

  const chartData = visits.slice(0, 4).map((visit, index) => ({
    name: visit.domain,
    value: visit.visitCount,
    color: colors[index]
  }));

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center">Loading domain statistics...</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 w-full bg-gradient-to-br from-background to-muted">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Domain Distribution</h3>
        <p className="text-sm text-muted-foreground">Your most visited websites</p>
      </div>
      
      <div className="flex justify-center items-center h-[300px] mt-4 md:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  strokeWidth={0}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '8px'
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {detailed && visits.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead>Domain</TableHead>
                <TableHead className="text-right">Visits</TableHead>
                <TableHead className="text-right">Time Spent</TableHead>
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