
import { Input } from "@/components/ui/input";
import { ChromeBookmark } from "@/types/bookmark";

interface SearchBarProps {
  searchTerm: string;
  onSearch: (value: string) => void;
  bookmarks?: ChromeBookmark[];
  onSelectBookmark?: (bookmark: ChromeBookmark) => void;
  suggestions?: string[];
  onSelectSuggestion?: (suggestion: string) => void;
}

const SearchBar = ({
  searchTerm,
  onSearch,
  suggestions = [],
  onSelectSuggestion = () => {},
}: SearchBarProps) => {
  return (
    <div className="relative">
      <Input
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search bookmarks..."
        className="w-full"
      />
      
      {searchTerm && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-accent cursor-pointer"
              onClick={() => {
                onSelectSuggestion(suggestion);
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
