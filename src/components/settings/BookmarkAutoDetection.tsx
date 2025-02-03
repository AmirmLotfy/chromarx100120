import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/stores/settingsStore";
import { toast } from "sonner";

const BookmarkAutoDetection = () => {
  const { autoDetectBookmarks, setAutoDetectBookmarks } = useSettings();

  useEffect(() => {
    if (autoDetectBookmarks && chrome.bookmarks) {
      const handleCreated = (id: string, bookmark: chrome.bookmarks.BookmarkTreeNode) => {
        if (bookmark.url) {
          toast.success("New bookmark detected!", {
            description: `"${bookmark.title}" has been added to your bookmarks.`,
          });
        }
      };

      chrome.bookmarks.onCreated.addListener(handleCreated);
      return () => {
        chrome.bookmarks.onCreated.removeListener(handleCreated);
      };
    }
  }, [autoDetectBookmarks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookmark Auto-Detection</CardTitle>
        <CardDescription>
          Automatically detect and add new bookmarks as you save them in Chrome
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="auto-detect">Enable auto-detection</Label>
          <Switch
            id="auto-detect"
            checked={autoDetectBookmarks}
            onCheckedChange={setAutoDetectBookmarks}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BookmarkAutoDetection;