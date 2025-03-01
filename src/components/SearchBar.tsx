import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ChromeBookmark } from "@/types/bookmark";
import { 
  Calendar,
  Filter, 
  Tag, 
  X, 
  ChevronDown,
  Star,
  Clock,
  Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

export interface SearchFilter {
  category?: string;
  domain?: string;
  hasTag?: string;
  dateAdded?: Date;
  isStarred?: boolean;
  isRecent?: boolean;
}

interface SearchBarProps {
  searchTerm: string;
  onSearch: (value: string) => void;
  bookmarks?: ChromeBookmark[];
  onSelectBookmark?: (bookmark: ChromeBookmark) => void;
  suggestions?: string[];
  onSelectSuggestion?: (suggestion: string) => void;
  onFilterChange?: (filters: SearchFilter) => void;
  categories?: string[];
  domains?: string[];
}

const SearchBar = ({
  searchTerm,
  onSearch,
  suggestions = [],
  onSelectSuggestion = () => {},
  onFilterChange = () => {},
  categories = [],
  domains = [],
}: SearchBarProps) => {
  const [filters, setFilters] = useState<SearchFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (newFilters: Partial<SearchFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full pr-10"
            />
            {searchTerm && (
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => onSearch("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="relative"
                aria-label="Filter bookmarks"
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Filter Bookmarks</h4>
                
                {/* Category filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                    {categories.map((category) => (
                      <Badge 
                        key={category}
                        variant={filters.category === category ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleFilterChange({ 
                          category: filters.category === category ? undefined : category 
                        })}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Domain filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Domain</label>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                    {domains.slice(0, 8).map((domain) => (
                      <Badge 
                        key={domain}
                        variant={filters.domain === domain ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleFilterChange({ 
                          domain: filters.domain === domain ? undefined : domain 
                        })}
                      >
                        {domain}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Date filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Added</label>
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateAdded}
                    onSelect={(date) => handleFilterChange({ dateAdded: date || undefined })}
                    className="border rounded-md p-3"
                  />
                </div>
                
                {/* Other filters */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="starred"
                      checked={filters.isStarred}
                      onCheckedChange={(checked) => 
                        handleFilterChange({ isStarred: checked as boolean || undefined })
                      }
                    />
                    <Label htmlFor="starred" className="flex items-center">
                      <Star className="h-4 w-4 mr-2" />
                      Starred
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="recent"
                      checked={filters.isRecent}
                      onCheckedChange={(checked) => 
                        handleFilterChange({ isRecent: checked as boolean || undefined })
                      }
                    />
                    <Label htmlFor="recent" className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Recent (Last 7 days)
                    </Label>
                  </div>
                </div>
                
                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button size="sm" onClick={() => setShowFilters(false)}>
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
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
      
      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {filters.category}
              <button onClick={() => handleFilterChange({ category: undefined })}>
                <X className="h-3 w-3 ml-1" />
              </button>
            </Badge>
          )}
          
          {filters.domain && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <span className="text-xs">🌐</span>
              {filters.domain}
              <button onClick={() => handleFilterChange({ domain: undefined })}>
                <X className="h-3 w-3 ml-1" />
              </button>
            </Badge>
          )}
          
          {filters.dateAdded && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {format(filters.dateAdded, 'MMM d, yyyy')}
              <button onClick={() => handleFilterChange({ dateAdded: undefined })}>
                <X className="h-3 w-3 ml-1" />
              </button>
            </Badge>
          )}
          
          {filters.isStarred && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              Starred
              <button onClick={() => handleFilterChange({ isStarred: undefined })}>
                <X className="h-3 w-3 ml-1" />
              </button>
            </Badge>
          )}
          
          {filters.isRecent && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recent
              <button onClick={() => handleFilterChange({ isRecent: undefined })}>
                <X className="h-3 w-3 ml-1" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
