import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Copy, Mail, MessageSquare, Star, StarOff, Trash2, FileText, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import SearchSummaries from "@/components/SearchSummaries";
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
  const [searchQuery, setSearchQuery] = useState("");

  const handleShare = async (summary: Summary, type: 'copy' | 'email' | 'whatsapp') => {
    const summaryText = `${summary.title}\n\n${summary.content}\n\nOriginal URL: ${summary.url}`;
    
    try {
      switch (type) {
        case 'copy':
          await navigator.clipboard.writeText(summaryText);
          toast.success("Summary copied to clipboard!");
          break;
        case 'email':
          window.location.href = `mailto:?subject=${encodeURIComponent(summary.title)}&body=${encodeURIComponent(summaryText)}`;
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, '_blank');
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

  const filterSummaries = (summaries: Summary[]) => {
    return summaries.filter(summary => {
      const matchesSearch = searchQuery.toLowerCase().trim() === "" ||
        summary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summary.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summary.url.toLowerCase().includes(searchQuery.toLowerCase());

      switch (activeTab) {
        case 'new':
          return matchesSearch && summary.isNew;
        case 'history':
          return matchesSearch;
        default:
          return matchesSearch && !summary.isNew;
      }
    });
  };

  const filteredSummaries = filterSummaries(summaries);
  const newSummaries = summaries.filter(s => s.isNew);

  const tabLabels = {
    current: 'Current',
    new: `New${newSummaries.length > 0 ? ` (${newSummaries.length})` : ''}`,
    history: 'History'
  };

  const SummaryCard = ({ summary }: { summary: Summary }) => (
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
            onClick={() => toggleStar(summary.id)}
            className="h-8 w-8"
          >
            {summary.isStarred ? (
              <Star className="h-4 w-4 fill-primary text-primary" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleShare(summary, 'copy')}>
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare(summary, 'email')}>
                <Mail className="h-4 w-4 mr-2" />
                Share via Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare(summary, 'whatsapp')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Share via WhatsApp
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
  );

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

        <div className="px-2">
          <SearchSummaries onSearch={setSearchQuery} />
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
              {filteredSummaries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery ? "No summaries found matching your search." :
                      activeTab === 'new'
                        ? 'No new summaries available.'
                        : activeTab === 'history'
                        ? 'No summary history available.'
                        : 'No summaries available. Select bookmarks and use the Summarize button to generate summaries.'}
                  </p>
                </div>
              ) : (
                filteredSummaries.map((summary) => (
                  <SummaryCard
                    key={summary.id}
                    summary={summary}
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

export default SummariesPage;
