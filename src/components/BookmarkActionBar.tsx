
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Tag, CheckCircle } from "lucide-react";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";

interface BookmarkActionBarProps {
  bookmarks: ChromeBookmark[];
  selectedBookmarks: ChromeBookmark[];
  onSelectAll: () => void;
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
}

const BookmarkActionBar = ({
  bookmarks,
  selectedBookmarks,
  onSelectAll,
  onUpdateCategories,
}: BookmarkActionBarProps) => {
  const handleSummarize = () => {
    if (selectedBookmarks.length === 0) {
      toast.error("Please select bookmarks to summarize");
      return;
    }
    
    toast.info("Summarize feature will be available soon");
  };

  const handleCategorize = () => {
    if (selectedBookmarks.length === 0) {
      toast.error("Please select bookmarks to categorize");
      return;
    }
    
    // Use the existing onUpdateCategories function
    onUpdateCategories(selectedBookmarks);
  };

  return (
    <div className="flex items-center gap-2 mb-4 py-2 px-1 bg-background/80 backdrop-blur-sm sticky top-0 z-10 rounded-lg">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSummarize}
        className="flex items-center gap-1.5 h-8 rounded-full"
      >
        <FileText className="h-3.5 w-3.5" />
        <span className="text-xs">Summarize</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleCategorize}
        className="flex items-center gap-1.5 h-8 rounded-full"
      >
        <Tag className="h-3.5 w-3.5" />
        <span className="text-xs">Categorize</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onSelectAll}
        className="flex items-center gap-1.5 h-8 rounded-full"
      >
        <CheckCircle className="h-3.5 w-3.5" />
        <span className="text-xs">Select All</span>
      </Button>
    </div>
  );
};

export default BookmarkActionBar;
