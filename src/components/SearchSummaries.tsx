
import { useState } from "react";
import { Input } from "./ui/input";
import { Search } from "lucide-react";

interface SearchSummariesProps {
  onSearch: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const SearchSummaries = ({ onSearch, onFocus, onBlur }: SearchSummariesProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search summaries..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="pl-9 w-full rounded-full border-muted bg-muted/40 focus-visible:bg-background h-10"
      />
    </div>
  );
};

export default SearchSummaries;
