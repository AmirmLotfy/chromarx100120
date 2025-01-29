import { Button } from "../ui/button";
import { FileText, Sparkles, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { summarizeContent, suggestBookmarkCategory } from "@/utils/geminiUtils";

interface BookmarkSelectionActionsProps {
  selectedBookmarks: Set<string>;
  bookmarks: ChromeBookmark[];
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

const BookmarkSelectionActions = ({
  selectedBookmarks,
  bookmarks,
  onUpdateCategories,
  isProcessing,
  setIsProcessing,
}: BookmarkSelectionActionsProps) => {
  const navigate = useNavigate();

  const handleGenerateSummaries = async () => {
    if (selectedBookmarks.size === 0) {
      toast.error("Please select bookmarks to summarize");
      return;
    }

    setIsProcessing(true);
    try {
      const selectedBookmarksArray = Array.from(selectedBookmarks)
        .map(id => bookmarks.find(b => b.id === id))
        .filter((b): b is ChromeBookmark => b !== undefined);

      const summaries = await Promise.all(
        selectedBookmarksArray.map(async (bookmark) => {
          const summary = await summarizeContent(`${bookmark.title}\n${bookmark.url}`);
          return {
            id: bookmark.id,
            title: bookmark.title,
            content: summary,
            url: bookmark.url || "",
            date: new Date().toLocaleDateString(),
          };
        })
      );

      const existingSummaries = JSON.parse(
        localStorage.getItem("bookmarkSummaries") || "[]"
      );
      localStorage.setItem(
        "bookmarkSummaries",
        JSON.stringify([...summaries, ...existingSummaries])
      );

      toast.success("Summaries generated successfully!");
      navigate("/summaries");
    } catch (error) {
      toast.error("Failed to generate summaries");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestCategories = async () => {
    if (selectedBookmarks.size === 0) {
      toast.error("Please select bookmarks to categorize");
      return;
    }

    setIsProcessing(true);
    try {
      const selectedBookmarksArray = Array.from(selectedBookmarks)
        .map(id => bookmarks.find(b => b.id === id))
        .filter((b): b is ChromeBookmark => b !== undefined);

      const updatedBookmarks = await Promise.all(
        selectedBookmarksArray.map(async (bookmark) => ({
          ...bookmark,
          category: await suggestBookmarkCategory(bookmark.title, bookmark.url || ""),
        }))
      );

      onUpdateCategories(updatedBookmarks);
      toast.success("Categories suggested successfully!");
    } catch (error) {
      toast.error("Failed to suggest categories");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateSummaries}
              disabled={isProcessing}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-1.5" />
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
              variant="secondary"
              size="sm"
              onClick={handleSuggestCategories}
              disabled={isProcessing}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Categorize
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Suggest categories for selected bookmarks
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default BookmarkSelectionActions;