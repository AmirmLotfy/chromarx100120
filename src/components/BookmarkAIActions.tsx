
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChromeBookmark } from "@/types/bookmark";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { summarizeBookmark, suggestBookmarkCategory } from "@/utils/geminiUtils";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/stores/languageStore";
import { LoadingOverlay } from "./ui/loading-overlay";
import { useState } from "react";
import { auth } from "@/lib/chrome-utils";
import { chromeDb } from "@/lib/chrome-storage";

interface BookmarkAIActionsProps {
  selectedBookmarks: ChromeBookmark[];
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
}

const BookmarkAIActions = ({
  selectedBookmarks,
  onUpdateCategories,
}: BookmarkAIActionsProps) => {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const handleGenerateSummaries = async () => {
    try {
      // Check authentication first
      const user = await auth.getCurrentUser();
      if (!user) {
        toast.error("Please sign in to use AI features");
        navigate("/");
        return;
      }

      if (selectedBookmarks.length === 0) {
        toast.error("Please select bookmarks to summarize");
        return;
      }

      setIsProcessing(true);
      setProcessingMessage("Generating summaries...");
      
      const summaries = await Promise.all(
        selectedBookmarks.map(async (bookmark) => {
          try {
            console.log(`Summarizing bookmark: ${bookmark.title}`);
            const summary = await summarizeBookmark(bookmark, currentLanguage.code);
            console.log(`Summary generated for ${bookmark.title}:`, summary);
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
    }
  };

  const handleSuggestCategories = async () => {
    try {
      // Check authentication first
      const user = await auth.getCurrentUser();
      if (!user) {
        toast.error("Please sign in to use AI features");
        navigate("/");
        return;
      }

      if (selectedBookmarks.length === 0) {
        toast.error("Please select bookmarks to categorize");
        return;
      }

      setIsProcessing(true);
      setProcessingMessage("Suggesting categories...");
      
      const categorizedBookmarks = await Promise.all(
        selectedBookmarks.map(async (bookmark) => {
          try {
            console.log(`Categorizing bookmark: ${bookmark.title}`);
            const category = await suggestBookmarkCategory(bookmark.title, bookmark.url || "");
            console.log(`Category suggested for ${bookmark.title}:`, category);
            
            // Store the categorized bookmark
            const updatedBookmark = {
              ...bookmark,
              category,
            };
            
            // Update in Chrome bookmarks
            if (chrome.bookmarks) {
              await chrome.bookmarks.update(bookmark.id, {
                title: bookmark.title,
                url: bookmark.url,
              });
            }
            
            // Store category in local storage
            await chromeDb.set(`bookmark-category-${bookmark.id}`, category);
            
            return updatedBookmark;
          } catch (error) {
            console.error(`Error categorizing bookmark ${bookmark.title}:`, error);
            toast.error(`Failed to categorize ${bookmark.title}`);
            return bookmark;
          }
        })
      );

      onUpdateCategories(categorizedBookmarks);
      toast.success("Categories suggested and saved successfully!");
    } catch (error) {
      console.error("Failed to suggest categories:", error);
      toast.error("Failed to suggest categories");
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isProcessing} message={processingMessage} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="animate-fade-in"
            disabled={isProcessing}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleGenerateSummaries}>
            Generate Summaries
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSuggestCategories}>
            Suggest Categories
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default BookmarkAIActions;
