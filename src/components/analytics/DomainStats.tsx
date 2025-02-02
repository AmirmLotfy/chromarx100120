import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DomainStat } from "@/types/analytics";

interface DomainStatsProps {
  data: DomainStat[];
}

const DomainStats = ({ data }: DomainStatsProps) => {
  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Top Domains</h3>
      <ScrollArea className="h-[200px] w-full">
        <div className="space-y-4">
          {data.map((stat, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm truncate flex-1">{stat.domain}</span>
              <span className="text-sm text-muted-foreground">
                {stat.visits} visits
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default DomainStats;