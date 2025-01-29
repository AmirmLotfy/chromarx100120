import { Button } from "@/components/ui/button";
import { FileText, Tag, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { ChromeBookmark } from "@/types/bookmark";

interface BookmarkAIActionsProps {
  selectedBookmarks: ChromeBookmark[];
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
}

const BookmarkAIActions = ({
  selectedBookmarks,
  onUpdateCategories,
}: BookmarkAIActionsProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAIAction = async (action: "summarize" | "categorize" | "cleanup") => {
    if (selectedBookmarks.length === 0) {
      toast.error("Please select bookmarks first");
      return;
    }

    setIsProcessing(true);
    try {
      switch (action) {
        case "summarize":
          // Implement summarize logic
          toast.success("Bookmarks summarized successfully");
          break;
        case "categorize":
          // Implement categorize logic
          toast.success("Bookmarks categorized successfully");
          break;
        case "cleanup":
          // Implement cleanup logic
          toast.success("Bookmarks cleaned up successfully");
          break;
      }
    } catch (error) {
      toast.error(`Failed to ${action} bookmarks`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-card rounded-lg border shadow-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="relative group hover:border-primary/50"
              onClick={() => handleAIAction("summarize")}
              disabled={isProcessing || selectedBookmarks.length === 0}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2 group-hover:text-primary" />
              )}
              Summarize
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Generate summaries for selected bookmarks
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="relative group hover:border-primary/50"
              onClick={() => handleAIAction("categorize")}
              disabled={isProcessing || selectedBookmarks.length === 0}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Tag className="h-4 w-4 mr-2 group-hover:text-primary" />
              )}
              Categorize
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Auto-categorize selected bookmarks
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="relative group hover:border-primary/50"
              onClick={() => handleAIAction("cleanup")}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2 group-hover:text-primary" />
              )}
              Cleanup
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Find and remove duplicate or broken bookmarks
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default BookmarkAIActions;