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
    <div>
      <Input
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search bookmarks..."
      />
    </div>
  );
};

export default SearchBar;