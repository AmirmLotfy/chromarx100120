
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface BookmarkControlsProps {
  sortBy: "title" | "dateAdded" | "url";
  onSortChange: (value: "title" | "dateAdded" | "url") => void;
}

const BookmarkControls = ({ sortBy, onSortChange }: BookmarkControlsProps) => {
  return (
    <div className="w-full md:w-[300px] space-y-6">
      <Select
        value={sortBy}
        onValueChange={(value) => onSortChange(value as "title" | "dateAdded" | "url")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dateAdded">Date Added</SelectItem>
          <SelectItem value="title">Title</SelectItem>
          <SelectItem value="url">URL</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default BookmarkControls;
