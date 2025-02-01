import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

interface BookmarkDomainsProps {
  domains: { domain: string; count: number }[];
  selectedDomain: string | null;
  onSelectDomain: (domain: string | null) => void;
}

const BookmarkDomains = ({
  domains,
  selectedDomain,
  onSelectDomain,
}: BookmarkDomainsProps) => {
  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-1 pr-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectDomain(null)}
          className={cn(
            "w-full justify-start",
            selectedDomain === null && "bg-accent text-accent-foreground"
          )}
        >
          <Globe className="h-4 w-4 mr-2" />
          All Domains
        </Button>
        {domains.map(({ domain, count }) => (
          <Button
            key={domain}
            variant="ghost"
            size="sm"
            onClick={() => onSelectDomain(domain)}
            className={cn(
              "w-full justify-start",
              selectedDomain === domain && "bg-accent text-accent-foreground"
            )}
          >
            <span className="truncate">{domain}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {count}
            </span>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default BookmarkDomains;