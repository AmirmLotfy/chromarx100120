import { Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4" />
        <h2 className="text-sm font-medium">Domains</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedDomain === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onSelectDomain(null)}
        >
          All
        </Badge>
        {domains.map(({ domain, count }) => (
          <Badge
            key={domain}
            variant={selectedDomain === domain ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onSelectDomain(domain)}
          >
            {domain} ({count})
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default BookmarkDomains;