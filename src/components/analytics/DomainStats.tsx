
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DomainStat } from "@/types/analytics";
import { useIsMobile } from "@/hooks/use-mobile";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface DomainStatsProps {
  data: DomainStat[];
}

const DomainStats = ({ data }: DomainStatsProps) => {
  const isMobile = useIsMobile();
  const [sortBy, setSortBy] = useState<"visits" | "timeSpent" | "efficiency">("timeSpent");

  const formatTime = (timeSpent: number) => {
    const hours = Math.floor(timeSpent / (60 * 60 * 1000));
    const minutes = Math.floor((timeSpent % (60 * 60 * 1000)) / (60 * 1000));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const calculateEfficiency = (timeSpent: number, visits: number) => {
    if (visits === 0) return 0;
    const avgTimePerVisit = timeSpent / visits;
    const optimalTimePerVisit = 10 * 60 * 1000; // 10 minutes
    return Math.min(100, Math.round((optimalTimePerVisit / avgTimePerVisit) * 100));
  };

  // Calculate week-over-week changes (mocked for now)
  const getWeekOverWeekChange = (domain: string) => {
    // This would be replaced with actual historical data
    const randomChange = Math.floor(Math.random() * 40) - 20; // -20% to +20%
    return randomChange;
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (sortBy === "visits") return b.visits - a.visits;
      if (sortBy === "timeSpent") return b.timeSpent - a.timeSpent;
      if (sortBy === "efficiency") {
        return calculateEfficiency(b.timeSpent, b.visits) - calculateEfficiency(a.timeSpent, a.visits);
      }
      return 0;
    });
  }, [data, sortBy]);

  return (
    <Card className="p-4 space-y-3 rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/30">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">Top Domains</h3>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5">
              {sortBy === "visits" ? "By Visits" : sortBy === "timeSpent" ? "By Time" : "By Efficiency"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setSortBy("timeSpent")}>
              By Time Spent
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("visits")}>
              By Visits
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("efficiency")}>
              By Efficiency
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <ScrollArea className="h-[240px] -mx-2 px-2">
        <div className="space-y-3 pb-1">
          {sortedData.map((stat, index) => {
            const efficiency = calculateEfficiency(stat.timeSpent, stat.visits);
            const weekChange = getWeekOverWeekChange(stat.domain);
            
            return (
              <div 
                key={index} 
                className="space-y-2 py-2 hover:bg-muted/20 rounded-lg transition-colors px-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm truncate max-w-[60%]">{stat.domain}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatTime(stat.timeSpent)}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Efficiency</span>
                    <div className="flex items-center">
                      <span>{efficiency}%</span>
                      
                      {weekChange !== 0 && (
                        <span 
                          className={`ml-1 flex items-center ${
                            weekChange > 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {weekChange > 0 ? 
                            <TrendingUp className="h-3 w-3 ml-1" /> : 
                            <TrendingDown className="h-3 w-3 ml-1" />
                          }
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={efficiency} 
                    className="h-1" 
                    indicatorClassName={efficiency > 75 ? "bg-green-500" : efficiency > 40 ? "bg-amber-500" : "bg-red-500"}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground pt-0.5">
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
