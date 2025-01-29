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
  // This would be actual domain data from Chrome history/bookmarks
  const data = [
    { name: "Work", value: 40, color: "#9b87f5" },
    { name: "Social", value: 30, color: "#7E69AB" },
    { name: "Entertainment", value: 20, color: "#E5DEFF" },
    { name: "Other", value: 10, color: "#F1F0FB" },
  ];

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Domain Distribution</h3>
        
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Time Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>example.com</TableCell>
                <TableCell>150</TableCell>
                <TableCell>2h 30m</TableCell>
              </TableRow>
              {/* Add more rows with actual data */}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
};

export default DomainStats;