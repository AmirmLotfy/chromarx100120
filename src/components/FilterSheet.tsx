import { SortOption } from "@/types/sort";
import { FilterOptions } from "@/types/filter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";

interface FilterSheetProps {
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  filterOptions: FilterOptions;
  onFilterChange: (options: FilterOptions) => void;
}

const FilterSheet = ({
  sortOption,
  onSortChange,
  filterOptions,
  onFilterChange,
}: FilterSheetProps) => {
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label>Sort by</Label>
        <Select
          value={sortOption}
          onValueChange={(value) => onSortChange(value as SortOption)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dateAdded">Date Added</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="url">URL</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FilterSheet;