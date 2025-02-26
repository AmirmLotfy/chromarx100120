
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Report {
  id: string;
  title: string;
  date: string;
  type: "weekly" | "monthly";
}

const ProductivityReports = () => {
  const reports: Report[] = [
    {
      id: "1",
      title: "Weekly Productivity Summary",
      date: "2024-03-10",
      type: "weekly"
    },
    {
      id: "2",
      title: "Monthly Performance Report",
      date: "2024-03-01",
      type: "monthly"
    }
  ];

  const handleDownload = (report: Report) => {
    // TODO: Implement actual report download
    toast.success(`Downloading ${report.title}`);
  };

  const handleGenerateReport = () => {
    toast.success("Generating new report...");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-lg font-semibold">Productivity Reports</h2>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select defaultValue="weekly">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly Report</SelectItem>
              <SelectItem value="monthly">Monthly Report</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleGenerateReport}>
            <FileText className="w-4 h-4 mr-2" />
            Generate
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium">{report.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(report.date).toLocaleDateString()}
                </div>
              </div>
              
              <Button variant="outline" size="sm" onClick={() => handleDownload(report)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductivityReports;
