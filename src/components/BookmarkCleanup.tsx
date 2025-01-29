import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { findDuplicateBookmarks, findBrokenBookmarks } from "@/utils/bookmarkCleanup";

interface BookmarkCleanupProps {
  bookmarks: chrome.bookmarks.BookmarkTreeNode[];
  onDelete: (ids: string[]) => Promise<void>;
  onRefresh: () => void;
}

const BookmarkCleanup = ({ bookmarks, onDelete, onRefresh }: BookmarkCleanupProps) => {
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<{
    byUrl: { url: string; bookmarks: chrome.bookmarks.BookmarkTreeNode[] }[];
    byTitle: { title: string; bookmarks: chrome.bookmarks.BookmarkTreeNode[] }[];
  } | null>(null);
  const [brokenBookmarks, setBrokenBookmarks] = useState<chrome.bookmarks.BookmarkTreeNode[]>([]);

  const handleFindIssues = async () => {
    setLoading(true);
    try {
      const duplicateResults = findDuplicateBookmarks(bookmarks);
      const brokenResults = await findBrokenBookmarks(bookmarks);
      
      setDuplicates(duplicateResults);
      setBrokenBookmarks(brokenResults);
      
      const totalIssues = 
        duplicateResults.byUrl.length + 
        duplicateResults.byTitle.length + 
        brokenResults.length;
      
      toast.info(`Found ${totalIssues} issues with your bookmarks`);
    } catch (error) {
      toast.error("Failed to analyze bookmarks");
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setLoading(true);
    try {
      const idsToDelete = [
        ...brokenBookmarks.map(b => b.id),
        ...duplicates?.byUrl.flatMap(d => d.bookmarks.slice(1).map(b => b.id)) || [],
      ];

      await onDelete(idsToDelete);
      toast.success("Cleanup completed successfully");
      onRefresh();
      setDuplicates(null);
      setBrokenBookmarks([]);
    } catch (error) {
      toast.error("Failed to clean up bookmarks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookmark Cleanup</CardTitle>
        <CardDescription>
          Find and remove duplicate or broken bookmarks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleFindIssues}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze Bookmarks
          </Button>
          {(duplicates || brokenBookmarks.length > 0) && (
            <Button
              variant="destructive"
              onClick={handleCleanup}
              disabled={loading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clean Up
            </Button>
          )}
        </div>

        {duplicates && (
          <div className="space-y-2">
            {duplicates.byUrl.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Found {duplicates.byUrl.length} duplicate URLs
              </p>
            )}
            {duplicates.byTitle.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Found {duplicates.byTitle.length} duplicate titles
              </p>
            )}
          </div>
        )}

        {brokenBookmarks.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Found {brokenBookmarks.length} broken bookmarks
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BookmarkCleanup;