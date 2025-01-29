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
  view: "grid" | "list";
}

const DomainGroup = ({
  domain,
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
  view,
}: DomainGroupProps) => {
  const bookmarksInDomain = bookmarks.filter(
    (b) => b.url && extractDomain(b.url) === domain
  );

  if (bookmarksInDomain.length === 0) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 backdrop-blur-sm rounded-lg sticky top-0 z-10">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">{domain}</h3>
        <span className="text-xs text-muted-foreground">
          ({bookmarksInDomain.length})
        </span>
      </div>
      <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-2"}>
        {bookmarksInDomain.map((bookmark) => (
          <DraggableBookmark
            key={bookmark.id}
            bookmark={bookmark}
            selected={selectedBookmarks.has(bookmark.id)}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
            formatDate={formatDate}
            view={view}
          />
        ))}
      </div>
    </div>
  );
};

export default DomainGroup;