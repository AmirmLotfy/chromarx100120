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

interface BookmarkAIActionsProps {
  selectedBookmarks: ChromeBookmark[];
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
}

const BookmarkAIActions = ({
  selectedBookmarks,
  onUpdateCategories,
}: BookmarkAIActionsProps) => {
  const navigate = useNavigate();

  const handleGenerateSummaries = async () => {
    try {
      const summaries = await Promise.all(
        selectedBookmarks.map(async (bookmark) => {
          // Combine title and URL into a single content string
          const content = `${bookmark.title}\n${bookmark.url || ""}`;
          const summary = await summarizeBookmark(content);
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
    }
  };

  const handleSuggestCategories = async () => {
    try {
      const updatedBookmarks = await Promise.all(
        selectedBookmarks.map(async (bookmark) => ({
          ...bookmark,
          category: await suggestBookmarkCategory(bookmark.title, bookmark.url || "", 'en'),
        }))
      );

      onUpdateCategories(updatedBookmarks);
      toast.success("Categories suggested successfully!");
    } catch (error) {
      toast.error("Failed to suggest categories");
    }
  };

  if (selectedBookmarks.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="animate-fade-in"
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
  );
};

export default BookmarkAIActions;