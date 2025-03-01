
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
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <Card className="p-4 space-y-4 rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Reports</h3>
        
        <div className="flex gap-2">
          <Select defaultValue="weekly">
            <SelectTrigger className="h-8 text-xs w-[100px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          
          <Button size="sm" variant="outline" className="h-8" onClick={handleGenerateReport}>
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Generate
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[180px] -mx-2 px-2">
        <div className="space-y-3 pb-1">
          {reports.map((report) => (
            <div 
              key={report.id} 
              className="p-3 bg-muted/20 rounded-lg flex items-center justify-between"
            >
              <div className="space-y-1">
                <h4 className="font-medium text-sm">{report.title}</h4>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3 mr-1.5" />
                  {new Date(report.date).toLocaleDateString()}
                </div>
              </div>
              
              <Button variant="ghost" size="icon" onClick={() => handleDownload(report)}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          {reports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No reports available</p>
              <p className="text-xs mt-1">Generate a report to see it here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ProductivityReports;
