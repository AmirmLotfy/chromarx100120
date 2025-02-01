import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface DomainStatsProps {
  detailed?: boolean;
}

const DomainStats = ({ detailed = false }: DomainStatsProps) => {
  const data = [
    { name: "Work", value: 40, color: "#9b87f5" },
    { name: "Social", value: 30, color: "#7E69AB" },
    { name: "Entertainment", value: 20, color: "#E5DEFF" },
    { name: "Other", value: 10, color: "#F1F0FB" },
  ];

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight">Domain Distribution</h3>
        <p className="text-sm text-muted-foreground">Your most visited website categories</p>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {detailed && (
        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead className="text-right">Visits</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">example.com</TableCell>
                <TableCell className="text-right">150</TableCell>
                <TableCell className="text-right">2h 30m</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">work.com</TableCell>
                <TableCell className="text-right">120</TableCell>
                <TableCell className="text-right">1h 45m</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};

export default DomainStats;