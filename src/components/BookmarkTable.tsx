import { ChromeBookmark } from "@/types/bookmark";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";

interface BookmarkTableProps {
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onUpdateBookmark: (bookmark: ChromeBookmark) => void;
  onDeleteBookmark: (id: string) => void;
}

const BookmarkTable = ({
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onUpdateBookmark,
  onDeleteBookmark,
}: BookmarkTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Select</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>URL</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookmarks.map((bookmark) => (
          <TableRow key={bookmark.id}>
            <TableCell>
              <Checkbox
                checked={selectedBookmarks.has(bookmark.id)}
                onCheckedChange={() => onToggleSelect(bookmark.id)}
              />
            </TableCell>
            <TableCell>{bookmark.title}</TableCell>
            <TableCell>
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                {bookmark.url}
              </a>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BookmarkTable;