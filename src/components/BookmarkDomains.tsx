import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

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
    <ScrollArea className="w-full">
      <div className="flex flex-wrap gap-2 p-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectDomain(null)}
          className={cn(
            "whitespace-nowrap",
            selectedDomain === null && "bg-primary text-primary-foreground"
          )}
        >
          All
        </Button>
        {domains.map(({ domain, count }) => (
          <Button
            key={domain}
            variant="outline"
            size="sm"
            onClick={() => onSelectDomain(domain)}
            className={cn(
              "whitespace-nowrap",
              selectedDomain === domain && "bg-primary text-primary-foreground"
            )}
          >
            {domain} ({count})
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default BookmarkDomains;