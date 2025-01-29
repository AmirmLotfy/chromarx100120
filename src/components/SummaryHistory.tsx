import { useState } from "react";
import { History, Star, StarOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Summary {
  id: string;
  title: string;
  content: string;
  date: string;
  language: string;
  isStarred: boolean;
  url: string;
}

const SummaryHistory = () => {
  const [summaries, setSummaries] = useState<Summary[]>(() => {
    const saved = localStorage.getItem("summaryHistory");
    return saved ? JSON.parse(saved) : [];
  });

  const toggleStar = (id: string) => {
    setSummaries((prev) => {
      const updated = prev.map((summary) =>
        summary.id === id
          ? { ...summary, isStarred: !summary.isStarred }
          : summary
      );
      localStorage.setItem("summaryHistory", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <History className="h-4 w-4" />
          Summary History
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Summary History</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {summaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No summaries generated yet
            </p>
          ) : (
            summaries.map((summary) => (
              <div
                key={summary.id}
                className="rounded-lg border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{summary.title}</h3>
                  <button
                    onClick={() => toggleStar(summary.id)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {summary.isStarred ? (
                      <Star className="h-4 w-4 fill-current" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{summary.content}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{summary.language}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {summary.date}
                  </span>
                </div>
                <a
                  href={summary.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View Original
                </a>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SummaryHistory;