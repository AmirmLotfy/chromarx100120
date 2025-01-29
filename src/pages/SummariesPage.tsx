import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ChromeBookmark } from "@/types/bookmark";
import { summarizeContent } from "@/utils/geminiUtils";

const SummariesPage = () => {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<{
    id: string;
    title: string;
    content: string;
    url: string;
    date: string;
  }[]>(() => {
    const saved = localStorage.getItem("bookmarkSummaries");
    return saved ? JSON.parse(saved) : [];
  });

  const handleShare = async (summary: typeof summaries[0]) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: summary.title,
          text: summary.content,
          url: summary.url,
        });
        toast.success("Summary shared successfully!");
      } else {
        await navigator.clipboard.writeText(`${summary.title}\n\n${summary.content}\n\n${summary.url}`);
        toast.success("Summary copied to clipboard!");
      }
    } catch (error) {
      toast.error("Failed to share summary");
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">Bookmark Summaries</h1>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-4">
          {summaries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No summaries generated yet. Select bookmarks to generate summaries.
            </p>
          ) : (
            summaries.map((summary) => (
              <div
                key={summary.id}
                className="p-4 rounded-lg border bg-card animate-fade-in"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-medium">{summary.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {summary.content}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleShare(summary)}
                    className="shrink-0"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <a
                    href={summary.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    View Original
                  </a>
                  <span>{summary.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SummariesPage;