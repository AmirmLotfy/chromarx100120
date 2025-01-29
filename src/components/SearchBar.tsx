import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChromeBookmark } from "@/types/bookmark";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  bookmarks: ChromeBookmark[];
  onSelectBookmark: (bookmark: ChromeBookmark) => void;
}

const SearchBar = ({
  searchQuery,
  onSearchChange,
}: SearchBarProps) => {
  return (
    <div className="p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search bookmarks..."
          className="pl-9"
        />
      </div>
    </div>
  );
};

export default SearchBar;