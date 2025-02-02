import { ChromeBookmark } from "@/types/bookmark";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Checkbox } from "./ui/checkbox";

interface BookmarkCardProps {
  bookmark: ChromeBookmark;
  isSelected: boolean;
  onToggleSelect: () => void;
  onUpdate: (bookmark: ChromeBookmark) => void;
  onDelete: () => void;
}

const BookmarkCard = ({
  bookmark,
  isSelected,
  onToggleSelect,
  onUpdate,
  onDelete,
}: BookmarkCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect()} />
        <h3 className="font-medium">{bookmark.title}</h3>
      </CardHeader>
      <CardContent>
        <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          {bookmark.url}
        </a>
      </CardContent>
    </Card>
  );
};

export default BookmarkCard;