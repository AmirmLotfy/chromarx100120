import { Button } from "./ui/button";
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
    <div className="flex flex-col gap-1.5 w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSelectDomain(null)}
        className={cn(
          "justify-start h-9 px-3 font-normal",
          selectedDomain === null && "bg-accent text-accent-foreground"
        )}
      >
        All Domains
      </Button>
      {domains.map(({ domain, count }) => (
        <Button
          key={domain}
          variant="ghost"
          size="sm"
          onClick={() => onSelectDomain(domain)}
          className={cn(
            "justify-start h-9 px-3 font-normal",
            selectedDomain === domain && "bg-accent text-accent-foreground"
          )}
        >
          {domain} ({count})
        </Button>
      ))}
    </div>
  );
};

export default BookmarkDomains;