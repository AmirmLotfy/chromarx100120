import Layout from "@/components/Layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, Star, StarOff, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
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
  const [summaries, setSummaries] = useState<Summary[]>(() => {
    const saved = localStorage.getItem("bookmarkSummaries");
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSummaries = summaries.filter(
    (summary) =>
      summary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteSummary = (id: string) => {
    setSummaries((prev) => {
      const updated = prev.filter((summary) => summary.id !== id);
      localStorage.setItem("bookmarkSummaries", JSON.stringify(updated));
      return updated;
    });
    toast.success("Summary deleted successfully");
  };

  const handleToggleStar = (id: string) => {
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

  return (
    <Layout>
      <div className="space-y-6 px-4 md:px-6 pb-20 md:pb-6 pt-6 md:pt-8">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Summaries</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            View and manage your bookmark summaries
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search summaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-4">
            {filteredSummaries.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No summaries found
              </div>
            ) : (
              filteredSummaries.map((summary) => (
                <Card key={summary.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-medium">{summary.title}</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleStar(summary.id)}
                        >
                          {summary.isStarred ? (
                            <Star className="h-4 w-4 fill-primary" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(summary.url, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSummary(summary.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{summary.content}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{summary.date}</span>
                      <a
                        href={summary.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {new URL(summary.url).hostname}
                      </a>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </Layout>
  );
};

export default SummariesPage;