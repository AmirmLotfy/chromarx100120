
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { summarizeContent, suggestBookmarkCategory, checkGeminiAvailability } from "@/utils/geminiUtils";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { findDuplicateBookmarks, findBrokenBookmarks } from "@/utils/bookmarkCleanup";
import { ChromeBookmark } from "@/types/bookmark";
import { useLanguage } from "@/stores/languageStore";
import { AIProgressIndicator } from "./ui/ai-progress-indicator";
import { fetchPageContent } from "@/utils/contentExtractor";

interface AIActionButtonsProps {
  selectedBookmarks?: ChromeBookmark[];
  onUpdateCategories?: (bookmarks: ChromeBookmark[]) => void;
}

const AIActionButtons = ({ selectedBookmarks = [], onUpdateCategories }: AIActionButtonsProps) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const { currentLanguage } = useLanguage();
  const [isApiAvailable, setIsApiAvailable] = useState<boolean | null>(null);

  // Check API availability when component mounts
  useState(() => {
    const checkAvailability = async () => {
      const available = await checkGeminiAvailability();
      setIsApiAvailable(available);
    };
    checkAvailability();
  });

  const handleCleanup = async () => {
    if (selectedBookmarks.length === 0) {
      toast.error("Please select bookmarks to clean up");
      return;
    }

    setIsProcessing(true);
    setProcessingMessage("Analyzing bookmarks...");
    setProgress(10);
    try {
      const duplicates = findDuplicateBookmarks(selectedBookmarks);
      setProgress(50);
      
      const brokenBookmarks = await findBrokenBookmarks(selectedBookmarks);
      setProgress(100);
      
      if (duplicates.byUrl.length === 0 && duplicates.byTitle.length === 0 && brokenBookmarks.length === 0) {
        toast.info("No issues found in selected bookmarks");
        return;
      }

      toast.success("Cleanup completed successfully");
    } catch (error) {
      console.error("Error in cleanup:", error);
      toast.error("Failed to clean up bookmarks");
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
      setProgress(0);
    }
  };

  const handleGenerateSummaries = async () => {
    if (selectedBookmarks.length === 0) {
      toast.error("Please select bookmarks to summarize");
      return;
    }

    // Check if API is available
    if (isApiAvailable === false) {
      toast.error("AI service is currently unavailable. Please try again later.");
      return;
    }

    setIsProcessing(true);
    setProcessingMessage("Generating summaries...");
    
    try {
      const totalBookmarks = selectedBookmarks.length;
      let completedBookmarks = 0;
      
      const summaries = await Promise.all(
        selectedBookmarks.map(async (bookmark, index) => {
          try {
            setProgress(Math.round((index / totalBookmarks) * 100));
            setProcessingMessage(`Summarizing ${index + 1}/${totalBookmarks}: ${bookmark.title.substring(0, 30)}...`);
            
            const summary = await summarizeContent(`Title: ${bookmark.title}\nURL: ${bookmark.url}`, currentLanguage.code);
            
            completedBookmarks++;
            setProgress(Math.round((completedBookmarks / totalBookmarks) * 100));
            
            return {
              id: bookmark.id,
              title: bookmark.title,
              content: summary,
              url: bookmark.url || "",
              date: new Date().toLocaleDateString(),
            };
          } catch (error) {
            console.error(`Error summarizing bookmark ${bookmark.title}:`, error);
            toast.error(`Failed to summarize ${bookmark.title}`);
            return null;
          }
        })
      );

      const validSummaries = summaries.filter((s): s is NonNullable<typeof s> => s !== null);
      
      if (validSummaries.length > 0) {
        const existingSummaries = JSON.parse(
          localStorage.getItem("bookmarkSummaries") || "[]"
        );
        localStorage.setItem(
          "bookmarkSummaries",
          JSON.stringify([...validSummaries, ...existingSummaries])
        );

        toast.success(`Generated ${validSummaries.length} summaries successfully!`);
        navigate("/summaries");
      } else {
        toast.error("Failed to generate any summaries");
      }
    } catch (error) {
      console.error("Failed to generate summaries:", error);
      toast.error("Failed to generate summaries");
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
      setProgress(0);
    }
  };

  const handleSuggestCategories = async () => {
    if (!onUpdateCategories || selectedBookmarks.length === 0) {
      toast.error("Please select bookmarks to categorize");
      return;
    }

    // Check if API is available
    if (isApiAvailable === false) {
      toast.error("AI service is currently unavailable. Please try again later.");
      return;
    }

    setIsProcessing(true);
    setProcessingMessage("Suggesting categories...");
    setProgress(10);
    
    try {
      const totalBookmarks = selectedBookmarks.length;
      
      const updatedBookmarks = await Promise.all(
        selectedBookmarks.map(async (bookmark, index) => {
          setProcessingMessage(`Analyzing ${index + 1}/${totalBookmarks}: ${bookmark.title.substring(0, 30)}...`);
          setProgress(Math.round(((index + 1) / totalBookmarks) * 100));
          
          try {
            const content = await fetchPageContent(bookmark.url || "");
            const category = await suggestBookmarkCategory(
              bookmark.title, 
              bookmark.url || "",
              content,
              currentLanguage.code
            );
            return {
              ...bookmark,
              category,
            };
          } catch (error) {
            console.error(`Error categorizing bookmark ${bookmark.title}:`, error);
            return {
              ...bookmark,
              category: "uncategorized",
            };
          }
        })
      );

      onUpdateCategories(updatedBookmarks);
      toast.success("Categories suggested successfully!");
    } catch (error) {
      console.error("Failed to suggest categories:", error);
      toast.error("Failed to suggest categories. Using default categories.");
      
      // Fallback: assign default categories
      const updatedBookmarks = selectedBookmarks.map(bookmark => ({
        ...bookmark,
        category: bookmark.category || "uncategorized",
      }));
      
      onUpdateCategories(updatedBookmarks);
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
      setProgress(0);
    }
  };

  return (
    <>
      <AIProgressIndicator 
        isLoading={isProcessing} 
        message={processingMessage} 
        progress={progress} 
        variant="overlay"
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
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
                {isProcessing ? "Processing..." : "Summarize"}
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
    </>
  );
};

export default AIActionButtons;
