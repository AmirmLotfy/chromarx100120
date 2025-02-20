
import { Button } from "./ui/button";
import { Magic, FolderTree } from "lucide-react";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";

interface BookmarkAIActionsProps {
  selectedBookmarks: ChromeBookmark[];
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
}

const BookmarkAIActions = ({ selectedBookmarks, onUpdateCategories }: BookmarkAIActionsProps) => {
  const handleAIAction = () => {
    // Redirect to login if AI features are needed
    chrome.tabs.create({
      url: "https://chromarx.it.com/login"
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleAIAction}
        className="h-7 w-7"
        title="AI Categorize"
      >
        <Magic className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleAIAction}
        className="h-7 w-7"
        title="Organize"
      >
        <FolderTree className="h-3.5 w-3.5" />
      </Button>
    </>
  );
};

export default BookmarkAIActions;
