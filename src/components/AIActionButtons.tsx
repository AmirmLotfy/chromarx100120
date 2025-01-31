import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Trash2, Languages } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { findDuplicateBookmarks, findBrokenBookmarks } from "@/utils/bookmarkCleanup";
import { ChromeBookmark } from "@/types/bookmark";
import { chromeAIService } from "@/services/chromeAIService";

interface AIActionButtonsProps {
  selectedBookmarks?: ChromeBookmark[];
  onUpdateCategories?: (bookmarks: ChromeBookmark[]) => void;
}

const AIActionButtons = ({ selectedBookmarks = [], onUpdateCategories }: AIActionButtonsProps) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerateSummaries = async () => {
    if (selectedBookmarks.length === 0) {
      toast.error("Please select bookmarks to summarize");
      return;
    }

    setIsProcessing(true);
    try {
      const summaries = await Promise.all(
        selectedBookmarks.map(async (bookmark) => {
          const summary = await chromeAIService.generateText(`${bookmark.title}\n${bookmark.url}`);
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
    if (!onUpdateCategories || selectedBookmarks.length === 0) {
      toast.error("Please select bookmarks to categorize");
      return;
    }

    setIsProcessing(true);
    try {
      const updatedBookmarks = await Promise.all(
        selectedBookmarks.map(async (bookmark) => {
          const prompt = `Suggest a category for this bookmark: ${bookmark.title} (${bookmark.url})`;
          const category = await chromeAIService.generateText(prompt);
          return {
            ...bookmark,
            category,
          };
        })
      );

      onUpdateCategories(updatedBookmarks);
      toast.success("Categories suggested successfully!");
    } catch (error) {
      toast.error("Failed to suggest categories");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCleanup = async () => {
    if (selectedBookmarks.length === 0) {
      toast.error("Please select bookmarks to clean up");
      return;
    }

    setIsProcessing(true);
    try {
      const duplicates = findDuplicateBookmarks(selectedBookmarks);
      const brokenBookmarks = await findBrokenBookmarks(selectedBookmarks);
      
      if (duplicates.byUrl.length === 0 && duplicates.byTitle.length === 0 && brokenBookmarks.length === 0) {
        toast.info("No issues found in selected bookmarks");
        return;
      }

      toast.success("Cleanup completed successfully");
    } catch (error) {
      toast.error("Failed to clean up bookmarks");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCleanup}
              disabled={isProcessing}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Cleanup
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Find and remove duplicate or broken bookmarks
          </TooltipContent>
        </Tooltip>

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

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/translations")}
              disabled={isProcessing}
              className="w-full"
            >
              <Languages className="h-4 w-4 mr-1.5" />
              Translate
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Translate bookmark content
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default AIActionButtons;