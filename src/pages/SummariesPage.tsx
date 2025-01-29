import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Share2, Star, StarOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Summary {
  id: string;
  title: string;
  content: string;
  url: string;
  date: string;
  isStarred?: boolean;
}

const SummariesPage = () => {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<Summary[]>(() => {
    const saved = localStorage.getItem("bookmarkSummaries");
    return saved ? JSON.parse(saved) : [];
  });

  const handleShare = async (summary: Summary) => {
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

  const toggleStar = (id: string) => {
    setSummaries((prev) => {
      const updated = prev.map((summary) =>
        summary.id === id
          ? { ...summary, isStarred: !summary.isStarred }
          : summary
      );
      localStorage.setItem("bookmarkSummaries", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteSummary = (id: string) => {
    setSummaries((prev) => {
      const updated = prev.filter((summary) => summary.id !== id);
      localStorage.setItem("bookmarkSummaries", JSON.stringify(updated));
      return updated;
    });
    toast.success("Summary deleted");
  };

  return (
    <Layout>
      <div className="space-y-6 pb-16">
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
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No summaries generated yet. Select bookmarks and use the Summarize
                  button to generate summaries.
                </p>
              </div>
            ) : (
              summaries.map((summary) => (
                <div
                  key={summary.id}
                  className="p-4 rounded-lg border bg-card animate-fade-in"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-medium line-clamp-1">{summary.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {summary.content}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStar(summary.id)}
                        className="h-8 w-8"
                      >
                        {summary.isStarred ? (
                          <Star className="h-4 w-4 fill-primary text-primary" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShare(summary)}
                        className="h-8 w-8"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSummary(summary.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
    </Layout>
  );
};

export default SummariesPage;