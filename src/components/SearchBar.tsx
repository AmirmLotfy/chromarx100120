import React from "react";
import { Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChromeBookmark } from "@/types/bookmark";
import { useIsMobile } from "@/hooks/use-mobile";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  bookmarks: ChromeBookmark[];
  onSelectBookmark: (bookmark: ChromeBookmark) => void;
}

const SearchBar = ({
  searchQuery,
  onSearchChange,
  bookmarks,
  onSelectBookmark,
}: SearchBarProps) => {
  const isMobile = useIsMobile();
  const suggestions = bookmarks.filter(
    (bookmark) =>
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full max-w-full sm:max-w-2xl mx-auto mb-4 sm:mb-8">
      <Command className="rounded-lg border shadow-md">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            value={searchQuery}
            onValueChange={onSearchChange}
            placeholder={isMobile ? "Search bookmarks..." : "Search bookmarks by title or URL..."}
            className="flex h-10 sm:h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        {searchQuery && (
          <CommandList className="max-h-[200px] sm:max-h-[300px] overflow-y-auto">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              {suggestions.slice(0, 5).map((bookmark) => (
                <CommandItem
                  key={bookmark.id}
                  onSelect={() => onSelectBookmark(bookmark)}
                  className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-accent"
                >
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium">{bookmark.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {bookmark.url}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        )}
      </Command>
    </div>
  );
};

export default SearchBar;