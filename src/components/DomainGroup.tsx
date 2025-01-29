import { ChromeBookmark } from "@/types/bookmark";
import { extractDomain } from "@/utils/domainUtils";
import { Globe } from "lucide-react";
import DraggableBookmark from "./DraggableBookmark";

interface DomainGroupProps {
  domain: string;
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
}

const DomainGroup = ({
  domain,
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
}: DomainGroupProps) => {
  const bookmarksInDomain = bookmarks.filter(
    (b) => b.url && extractDomain(b.url) === domain
  );

  if (bookmarksInDomain.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">{domain}</h3>
        <span className="text-xs text-muted-foreground">
          ({bookmarksInDomain.length})
        </span>
      </div>
      <div className="space-y-2">
        {bookmarksInDomain.map((bookmark) => (
          <DraggableBookmark
            key={bookmark.id}
            bookmark={bookmark}
            selected={selectedBookmarks.has(bookmark.id)}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  );
};

export default DomainGroup;