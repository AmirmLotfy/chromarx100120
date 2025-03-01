
import { Bookmark } from "lucide-react";

const BookmarkSearchView = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <Bookmark className="h-8 w-8 text-primary/70" />
      </div>
      <h3 className="text-lg font-medium mb-2">Bookmark Search Mode</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Describe what you're looking for, and I'll search your bookmarks to find related content.
      </p>
    </div>
  );
};

export default BookmarkSearchView;
