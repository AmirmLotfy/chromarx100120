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
    <div className="flex flex-col gap-1 w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSelectDomain(null)}
        className={cn(
          "justify-start h-8 px-2 font-normal text-sm rounded-md",
          selectedDomain === null && "bg-primary/10 text-primary font-medium"
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
            "justify-start h-8 px-2 font-normal text-sm rounded-md",
            selectedDomain === domain && "bg-primary/10 text-primary font-medium"
          )}
        >
          {domain} ({count})
        </Button>
      ))}
    </div>
  );
};

export default BookmarkDomains;