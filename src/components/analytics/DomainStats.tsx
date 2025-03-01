
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DomainStat } from "@/types/analytics";
import { useIsMobile } from "@/hooks/use-mobile";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DomainStatsProps {
  data: DomainStat[];
}

const DomainStats = ({ data }: DomainStatsProps) => {
  const isMobile = useIsMobile();
  const [sortBy, setSortBy] = useState<"visits" | "timeSpent" | "efficiency">("visits");
  const [showDetails, setShowDetails] = useState(false);

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

  const calculateProductivity = (domain: string) => {
    // Simplistic categorization - could be replaced with user-defined categories
    const highProductivity = ["github.com", "docs.google.com", "notion.so", "atlassian.com"];
    const mediumProductivity = ["linkedin.com", "stackoverflow.com", "medium.com"];
    const lowProductivity = ["facebook.com", "instagram.com", "twitter.com", "youtube.com"];
    
    if (highProductivity.some(d => domain.includes(d))) return 85;
    if (mediumProductivity.some(d => domain.includes(d))) return 60;
    if (lowProductivity.some(d => domain.includes(d))) return 30;
    return 50; // default
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
    <Card className="p-4 md:p-6 space-y-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold">Top Domains</h3>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                Sort: {sortBy === "visits" ? "Visits" : sortBy === "timeSpent" ? "Time" : "Efficiency"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("visits")}>
                Visits
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("timeSpent")}>
                Time Spent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("efficiency")}>
                Efficiency
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  Efficiency score is based on optimal visit duration and frequency.
                  {showDetails && 
                    <div>Higher scores indicate more focused usage.</div>
                  }
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <Minus className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <ScrollArea className="h-[200px] md:h-[250px] w-full">
        <div className="space-y-4">
          {sortedData.map((stat, index) => {
            const efficiency = calculateEfficiency(stat.timeSpent, stat.visits);
            const productivity = calculateProductivity(stat.domain);
            const weekChange = getWeekOverWeekChange(stat.domain);
            
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
                    <div className="flex items-center">
                      <span>{efficiency}%</span>
                      
                      {showDetails && weekChange !== 0 && (
                        <span 
                          className={`ml-1 flex items-center ${
                            weekChange > 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {weekChange > 0 ? 
                            <TrendingUp className="h-3 w-3 mr-1" /> : 
                            <TrendingDown className="h-3 w-3 mr-1" />
                          }
                          {Math.abs(weekChange)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress value={efficiency} className="h-1" />
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{stat.visits} visits</span>
                  <span>
                    ~{Math.round((stat.timeSpent / stat.visits) / (60 * 1000))}m/visit
                  </span>
                </div>
                
                {showDetails && (
                  <div className="pt-1 border-t border-border/50 mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Productivity</span>
                      <span className="font-medium">{productivity}%</span>
                    </div>
                    <Progress value={productivity} className="h-1 mt-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default DomainStats;
