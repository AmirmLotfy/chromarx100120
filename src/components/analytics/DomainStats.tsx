
"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DomainStat } from "@/types/analytics";
import { useIsMobile } from "@/hooks/use-mobile";

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

  return (
    <Card className="p-4 md:p-6 space-y-3 w-full">
      <h3 className="text-base md:text-lg font-semibold">Top Domains</h3>
      <ScrollArea className="h-[200px] md:h-[250px] w-full">
        <div className="space-y-3">
          {data.map((stat, index) => (
            <div key={index} className="flex justify-between items-center text-xs md:text-sm p-2 hover:bg-muted/50 rounded-lg">
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium truncate">{stat.domain}</span>
                <span className="text-muted-foreground">{stat.visits} visits</span>
              </div>
              <span className="text-muted-foreground ml-4">
                {formatTime(stat.timeSpent)}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default DomainStats;
