
import { useState, useEffect } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface BookmarkCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
}

interface CollectionViewProps {
  collection: BookmarkCollection;
  bookmarks: ChromeBookmark[];
  onBookmarkSelect: (bookmark: ChromeBookmark) => void;
}

const CollectionView = ({ collection, bookmarks, onBookmarkSelect }: CollectionViewProps) => {
  const [collectionBookmarks, setCollectionBookmarks] = useState<ChromeBookmark[]>([]);

  useEffect(() => {
    loadCollectionBookmarks();
  }, [collection.id]);

  const loadCollectionBookmarks = async () => {
    try {
      // Get collection items from localStorage
      const collectionItems = JSON.parse(localStorage.getItem('bookmarkCollectionItems') || '[]');
      const bookmarkIds = collectionItems
        .filter((item: any) => item.collection_id === collection.id)
        .map((item: any) => item.bookmark_id);
      
      const filteredBookmarks = bookmarks.filter(bookmark => bookmarkIds.includes(bookmark.id));
      setCollectionBookmarks(filteredBookmarks);
    } catch (error) {
      console.error('Error loading collection bookmarks:', error);
      toast.error('Failed to load collection bookmarks');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{collection.name}</h2>
        {collection.description && (
          <p className="text-sm text-muted-foreground">{collection.description}</p>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="grid gap-2">
          {collectionBookmarks.map((bookmark) => (
            <Card
              key={bookmark.id}
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onBookmarkSelect(bookmark)}
            >
              <h3 className="font-medium">{bookmark.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{bookmark.url}</p>
            </Card>
          ))}
          {collectionBookmarks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No bookmarks in this collection
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CollectionView;
