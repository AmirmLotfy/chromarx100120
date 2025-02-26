
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DomainStat } from "@/types/analytics";
import { useIsMobile } from "@/hooks/use-mobile";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface DomainStatsProps {
  data: DomainStat[];
}

const DomainStats = ({ data }: DomainStatsProps) => {
  const isMobile = useIsMobile();

  const formatTime = (timeSpent: number) => {
    const hours = Math.floor(timeSpent / (60 * 60 * 1000));
    const minutes = Math.floor((timeSpent % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m`;
  };

  const calculateEfficiency = (timeSpent: number, visits: number) => {
    const avgTimePerVisit = timeSpent / visits;
    const optimalTimePerVisit = 10 * 60 * 1000; // 10 minutes
    return Math.min(100, Math.round((optimalTimePerVisit / avgTimePerVisit) * 100));
  };

  return (
    <Card className="p-4 md:p-6 space-y-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold">Top Domains</h3>
        <Tooltip>
          <Info className="h-4 w-4 text-muted-foreground" />
          <div className="max-w-xs">
            Efficiency score is based on optimal visit duration and frequency
          </div>
        </Tooltip>
      </div>
      
      <ScrollArea className="h-[200px] md:h-[250px] w-full">
        <div className="space-y-4">
          {data.map((stat, index) => {
            const efficiency = calculateEfficiency(stat.timeSpent, stat.visits);
            
            return (
              <div 
                key={index} 
                className="space-y-2 p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <span className="font-medium truncate flex-1">{stat.domain}</span>
                  <span className="text-muted-foreground ml-2">
                    {formatTime(stat.timeSpent)}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Efficiency</span>
                    <span>{efficiency}%</span>
                  </div>
                  <Progress value={efficiency} className="h-1" />
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{stat.visits} visits</span>
                  <span>
                    ~{Math.round((stat.timeSpent / stat.visits) / (60 * 1000))}m/visit
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default DomainStats;
