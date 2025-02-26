import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Copy, Mail, MessageSquare, Star, StarOff, Trash2, Tag, ChevronDown, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import SearchSummaries from "@/components/SearchSummaries";
import jsPDF from 'jspdf';
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
  tags?: string[];
  category?: string;
}

const SummariesPage = () => {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<Summary[]>(() => {
    const saved = localStorage.getItem("bookmarkSummaries");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState<'current' | 'new' | 'history'>('current');
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

  const addTag = (summaryId: string, tag: string) => {
    setSummaries(prev => {
      const updated = prev.map(summary => {
        if (summary.id === summaryId) {
          const currentTags = summary.tags || [];
          if (!currentTags.includes(tag)) {
            return { ...summary, tags: [...currentTags, tag] };
          }
        }
        return summary;
      });
      localStorage.setItem("bookmarkSummaries", JSON.stringify(updated));
      return updated;
    });
    toast.success(`Added tag: ${tag}`);
  };

  const removeTag = (summaryId: string, tagToRemove: string) => {
    setSummaries(prev => {
      const updated = prev.map(summary => {
        if (summary.id === summaryId && summary.tags) {
          return {
            ...summary,
            tags: summary.tags.filter(tag => tag !== tagToRemove)
          };
        }
        return summary;
      });
      localStorage.setItem("bookmarkSummaries", JSON.stringify(updated));
      return updated;
    });
    toast.success(`Removed tag: ${tagToRemove}`);
  };

  const setCategory = (summaryId: string, category: string) => {
    setSummaries(prev => {
      const updated = prev.map(summary => {
        if (summary.id === summaryId) {
          return { ...summary, category };
        }
        return summary;
      });
      localStorage.setItem("bookmarkSummaries", JSON.stringify(updated));
      return updated;
    });
    toast.success(`Set category: ${category}`);
  };

  const filterSummaries = (summaries: Summary[]) => {
    return summaries.filter(summary => {
      const matchesSearch = searchQuery.toLowerCase().trim() === "" ||
        summary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summary.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summary.url.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag = !activeTag || (summary.tags && summary.tags.includes(activeTag));
      const matchesCategory = !activeCategory || summary.category === activeCategory;

      switch (activeTab) {
        case 'new':
          return matchesSearch && matchesTag && matchesCategory && summary.isNew;
        case 'history':
          return matchesSearch && matchesTag && matchesCategory;
        default:
          return matchesSearch && matchesTag && matchesCategory && !summary.isNew;
      }
    });
  };

  const getAllTags = () => {
    const tagsSet = new Set<string>();
    summaries.forEach(summary => {
      summary.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  };

  const getAllCategories = () => {
    const categoriesSet = new Set<string>();
    summaries.forEach(summary => {
      if (summary.category) {
        categoriesSet.add(summary.category);
      }
    });
    return Array.from(categoriesSet);
  };

  const filteredSummaries = filterSummaries(summaries);
  const newSummaries = summaries.filter(s => s.isNew);
  const allTags = getAllTags();
  const allCategories = getAllCategories();

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
          {(summary.tags && summary.tags.length > 0) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {summary.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTag(activeTag === tag ? null : tag);
                  }}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(summary.id, tag);
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {summary.category && (
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary cursor-pointer"
              onClick={() => setActiveCategory(activeCategory === summary.category ? null : summary.category)}
            >
              {summary.category}
            </span>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Tag className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => addTag(summary.id, "Important")}>
                Add Tag: Important
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addTag(summary.id, "Read Later")}>
                Add Tag: Read Later
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addTag(summary.id, "Reference")}>
                Add Tag: Reference
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory(summary.id, "Work")}>
                Set Category: Work
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory(summary.id, "Personal")}>
                Set Category: Personal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory(summary.id, "Research")}>
                Set Category: Research
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

  const exportToMarkdown = (summaries: Summary[]) => {
    const markdownContent = summaries.map(summary => {
      const tags = summary.tags ? `\nTags: ${summary.tags.join(', ')}` : '';
      const category = summary.category ? `\nCategory: ${summary.category}` : '';
      
      return `# ${summary.title}

${summary.content}

URL: ${summary.url}
Date: ${summary.date}${tags}${category}
${summary.isStarred ? '\n⭐ Starred' : ''}
---
`;
    }).join('\n');

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summaries.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exported to Markdown');
  };

  const exportToPDF = (summaries: Summary[]) => {
    const pdf = new jsPDF();
    let yOffset = 10;

    summaries.forEach((summary, index) => {
      if (yOffset > 250) {
        pdf.addPage();
        yOffset = 10;
      }

      pdf.setFontSize(16);
      pdf.text(summary.title, 10, yOffset);
      yOffset += 10;

      pdf.setFontSize(12);
      const contentLines = pdf.splitTextToSize(summary.content, 190);
      pdf.text(contentLines, 10, yOffset);
      yOffset += contentLines.length * 7;

      pdf.setFontSize(10);
      pdf.text(`URL: ${summary.url}`, 10, yOffset);
      yOffset += 5;
      pdf.text(`Date: ${summary.date}`, 10, yOffset);
      yOffset += 5;

      if (summary.tags && summary.tags.length > 0) {
        pdf.text(`Tags: ${summary.tags.join(', ')}`, 10, yOffset);
        yOffset += 5;
      }

      if (summary.category) {
        pdf.text(`Category: ${summary.category}`, 10, yOffset);
        yOffset += 5;
      }

      if (index < summaries.length - 1) {
        pdf.line(10, yOffset, 200, yOffset);
        yOffset += 10;
      }
    });

    pdf.save('summaries.pdf');
    toast.success('Exported to PDF');
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
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportToMarkdown(filteredSummaries)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToPDF(filteredSummaries)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        </div>

        <div className="px-2 space-y-4">
          <SearchSummaries onSearch={setSearchQuery} />
          
          {(allTags.length > 0 || allCategories.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Button
                  key={tag}
                  variant={activeTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className="h-7"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Button>
              ))}
              {allCategories.map(category => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                  className="h-7"
                >
                  {category}
                </Button>
              ))}
            </div>
          )}
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
                    {searchQuery || activeTag || activeCategory ? 
                      "No summaries found matching your filters." :
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
