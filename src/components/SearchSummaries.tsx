
import { useState } from "react";
import { Input } from "./ui/input";
import { Search } from "lucide-react";

interface SearchSummariesProps {
  onSearch: (query: string) => void;
}

const SearchSummaries = ({ onSearch }: SearchSummariesProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search summaries..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-8 w-full"
      />
    </div>
  );
};

export default SearchSummaries;
