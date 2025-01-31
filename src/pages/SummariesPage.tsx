import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Share2, Star, StarOff, Trash2, Copy, MessageSquare, FileText, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Summary {
  id: string;
  title: string;
  content: string;
  url: string;
  date: string;
  isStarred?: boolean;
  isNew?: boolean;
}

const SummariesPage = () => {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<Summary[]>(() => {
    const saved = localStorage.getItem("bookmarkSummaries");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState<'current' | 'new' | 'history'>('current');

  const handleShare = async (summary: Summary, type: 'copy' | 'whatsapp' | 'notes') => {
    try {
      const summaryText = `${summary.title}\n\n${summary.content}\n\n${summary.url}`;
      
      switch (type) {
        case 'copy':
          await navigator.clipboard.writeText(summaryText);
          toast.success("Summary copied to clipboard!");
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`);
          break;
        case 'notes':
          const notes = JSON.parse(localStorage.getItem("notes") || "[]");
          const newNote = {
            id: crypto.randomUUID(),
            title: `Summary: ${summary.title}`,
            content: summaryText,
            category: "Summaries",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem("notes", JSON.stringify([...notes, newNote]));
          toast.success("Added to notes!");
          break;
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

  const clearAllSummaries = () => {
    setSummaries([]);
    localStorage.removeItem("bookmarkSummaries");
    toast.success("All summaries cleared");
  };

  const newSummaries = summaries.filter(s => s.isNew);
  const regularSummaries = summaries.filter(s => !s.isNew);

  const getActiveContent = () => {
    switch (activeTab) {
      case 'new':
        return newSummaries;
      case 'history':
        return summaries;
      default:
        return regularSummaries;
    }
  };

  const tabLabels = {
    current: 'Current',
    new: `New${newSummaries.length > 0 ? ` (${newSummaries.length})` : ''}`,
    history: 'History'
  };

  return (
    <Layout>
      <div className="space-y-6 pb-16 pt-4">
        <div className="flex items-center justify-between gap-4 px-2">
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
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllSummaries}
            className="h-8 px-3 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive md:text-sm md:h-9 md:px-4"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1 md:h-4 md:w-4" />
            Clear
          </Button>
        </div>

        <div className="w-full">
          <div className="md:hidden w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {tabLabels[activeTab]}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-[200px] bg-background border">
                <DropdownMenuItem onClick={() => setActiveTab('current')}>
                  Current
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('new')}>
                  New {newSummaries.length > 0 && `(${newSummaries.length})`}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('history')}>
                  History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden md:grid w-full grid-cols-3">
            <Button
              variant={activeTab === 'current' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('current')}
              className="rounded-none"
            >
              Current
            </Button>
            <Button
              variant={activeTab === 'new' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('new')}
              className="rounded-none relative"
            >
              New
              {newSummaries.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {newSummaries.length}
                </span>
              )}
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('history')}
              className="rounded-none"
            >
              History
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="space-y-4 p-4">
              {getActiveContent().length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {activeTab === 'new'
                      ? 'No new summaries available.'
                      : activeTab === 'history'
                      ? 'No summary history available.'
                      : 'No summaries available. Select bookmarks and use the Summarize button to generate summaries.'}
                  </p>
                </div>
              ) : (
                getActiveContent().map((summary) => (
                  <SummaryCard
                    key={summary.id}
                    summary={summary}
                    onShare={handleShare}
                    onToggleStar={toggleStar}
                    onDelete={deleteSummary}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Layout>
  );
};

interface SummaryCardProps {
  summary: Summary;
  onShare: (summary: Summary, type: 'copy' | 'whatsapp' | 'notes') => void;
  onToggleStar: (id: string) => void;
  onDelete: (id: string) => void;
}

const SummaryCard = ({ summary, onShare, onToggleStar, onDelete }: SummaryCardProps) => (
  <div className="p-4 rounded-lg border bg-card animate-fade-in">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1 flex-1">
        <h3 className="font-medium line-clamp-1">{summary.title}</h3>
        <p className="text-sm text-muted-foreground">{summary.content}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleStar(summary.id)}
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
          onClick={() => onShare(summary, 'copy')}
          className="h-8 w-8"
          title="Copy to clipboard"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onShare(summary, 'whatsapp')}
          className="h-8 w-8"
          title="Share via WhatsApp"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onShare(summary, 'notes')}
          className="h-8 w-8"
          title="Add to notes"
        >
          <FileText className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(summary.id)}
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
);

export default SummariesPage;
