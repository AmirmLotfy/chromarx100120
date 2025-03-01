
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Copy, Mail, MessageSquare, Star, StarOff, 
  Trash2, Tag, ChevronDown, FileText, Download, Calendar, 
  Clock, MoreHorizontal, Search, Filter, X, CheckCircle, 
  SlidersHorizontal, BookOpen, Share2
} from "lucide-react";
import { toast } from "sonner";
import SearchSummaries from "@/components/SearchSummaries";
import jsPDF from 'jspdf';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuItem,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

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
  readingTime?: number;
}

const SummariesPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [summaries, setSummaries] = useState<Summary[]>(() => {
    const saved = localStorage.getItem("bookmarkSummaries");
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.map((summary: Summary) => ({
      ...summary,
      readingTime: summary.readingTime || Math.ceil(summary.content.split(' ').length / 200)
    }));
  });
  
  const [activeTab, setActiveTab] = useState<'all' | 'starred' | 'recent'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedSummaries, setSelectedSummaries] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'readingTime'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

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
    setSummaries(prev => {
      const updated = prev.map(summary => summary.id === id ? {
        ...summary,
        isStarred: !summary.isStarred
      } : summary);
      localStorage.setItem("bookmarkSummaries", JSON.stringify(updated));
      return updated;
    });
    
    toast.success(summaries.find(s => s.id === id)?.isStarred 
      ? "Removed from favorites" 
      : "Added to favorites");
  };

  const deleteSummary = (id: string) => {
    setSummaries(prev => {
      const updated = prev.filter(summary => summary.id !== id);
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
            return {
              ...summary,
              tags: [...currentTags, tag]
            };
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
          return {
            ...summary,
            category
          };
        }
        return summary;
      });
      localStorage.setItem("bookmarkSummaries", JSON.stringify(updated));
      return updated;
    });
    toast.success(`Set category: ${category}`);
  };

  const toggleSelectSummary = (id: string) => {
    setSelectedSummaries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedSummaries(new Set(filteredSummaries.map(s => s.id)));
  };

  const deselectAll = () => {
    setSelectedSummaries(new Set());
  };

  const bulkDelete = () => {
    if (selectedSummaries.size === 0) return;
    setSummaries(prev => {
      const updated = prev.filter(summary => !selectedSummaries.has(summary.id));
      localStorage.setItem("bookmarkSummaries", JSON.stringify(updated));
      return updated;
    });
    setSelectedSummaries(new Set());
    toast.success(`Deleted ${selectedSummaries.size} summaries`);
  };

  const bulkAddTag = (tag: string) => {
    if (selectedSummaries.size === 0) return;
    setSummaries(prev => {
      const updated = prev.map(summary => {
        if (selectedSummaries.has(summary.id)) {
          const currentTags = summary.tags || [];
          if (!currentTags.includes(tag)) {
            return {
              ...summary,
              tags: [...currentTags, tag]
            };
          }
        }
        return summary;
      });
      localStorage.setItem("bookmarkSummaries", JSON.stringify(updated));
      return updated;
    });
    toast.success(`Added tag to ${selectedSummaries.size} summaries`);
  };

  const bulkSetCategory = (category: string) => {
    if (selectedSummaries.size === 0) return;
    setSummaries(prev => {
      const updated = prev.map(summary => selectedSummaries.has(summary.id) ? {
        ...summary,
        category
      } : summary);
      localStorage.setItem("bookmarkSummaries", JSON.stringify(updated));
      return updated;
    });
    toast.success(`Set category for ${selectedSummaries.size} summaries`);
  };

  const filterSummaries = (summaries: Summary[]) => {
    return summaries.filter(summary => {
      const matchesSearch = searchQuery.toLowerCase().trim() === "" || 
        summary.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        summary.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
        summary.url.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !activeTag || summary.tags && summary.tags.includes(activeTag);
      const matchesCategory = !activeCategory || summary.category === activeCategory;
      const summaryDate = new Date(summary.date);
      const matchesDateRange = (!dateRange?.from || summaryDate >= dateRange.from) && 
        (!dateRange?.to || summaryDate <= dateRange.to);
      
      switch (activeTab) {
        case 'starred':
          return matchesSearch && matchesTag && matchesCategory && matchesDateRange && summary.isStarred;
        case 'recent':
          // Consider summaries from the last 7 days as recent
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return matchesSearch && matchesTag && matchesCategory && matchesDateRange && 
            summaryDate >= sevenDaysAgo;
        default:
          return matchesSearch && matchesTag && matchesCategory && matchesDateRange;
      }
    }).sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return sortOrder === 'asc' ? 
            new Date(a.date).getTime() - new Date(b.date).getTime() : 
            new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'title':
          return sortOrder === 'asc' ? 
            a.title.localeCompare(b.title) : 
            b.title.localeCompare(a.title);
        case 'readingTime':
          return sortOrder === 'asc' ? 
            (a.readingTime || 0) - (b.readingTime || 0) : 
            (b.readingTime || 0) - (a.readingTime || 0);
        default:
          return 0;
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
    const blob = new Blob([markdownContent], {
      type: 'text/markdown'
    });
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

  const filteredSummaries = filterSummaries(summaries);
  const starredSummaries = summaries.filter(s => s.isStarred);
  const allTags = getAllTags();
  const allCategories = getAllCategories();
  
  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveTag(null);
    setActiveCategory(null);
    setDateRange(undefined);
    setSortBy('date');
    setSortOrder('desc');
    setIsFilterVisible(false);
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== "" || activeTag !== null || activeCategory !== null || dateRange !== undefined;

  const SummaryCard = ({ summary }: { summary: Summary }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative p-4 rounded-xl border bg-card shadow-sm overflow-hidden"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base line-clamp-1 mb-1">{summary.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{summary.content}</p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 mb-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{summary.readingTime} min read</span>
            {summary.category && (
              <>
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                <span 
                  className="hover:underline cursor-pointer"
                  onClick={() => setActiveCategory(activeCategory === summary.category ? null : summary.category)}
                >
                  {summary.category}
                </span>
              </>
            )}
          </div>
          
          {summary.tags && summary.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2 mt-3">
              {summary.tags.slice(0, 3).map(tag => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="px-2 py-0 h-5 text-xs rounded-full border-primary/20 hover:bg-primary/10 cursor-pointer"
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  {tag}
                </Badge>
              ))}
              {summary.tags.length > 3 && (
                <Badge variant="outline" className="px-2 py-0 h-5 text-xs rounded-full border-muted">
                  +{summary.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
            <a 
              href={summary.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="truncate max-w-[200px] hover:underline text-primary/80"
            >
              {new URL(summary.url).hostname}
            </a>
            <span>{format(new Date(summary.date), 'MMM d, yyyy')}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => toggleStar(summary.id)} 
            className="h-8 w-8 rounded-full"
          >
            {summary.isStarred ? 
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : 
              <Star className="h-4 w-4" />
            }
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => handleShare(summary, 'copy')}>
                <Copy className="h-4 w-4 mr-2" />
                Copy to clipboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare(summary, 'email')}>
                <Mail className="h-4 w-4 mr-2" />
                Share via email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addTag(summary.id, "Important")}>
                <Tag className="h-4 w-4 mr-2" />
                Add tag: Important
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => deleteSummary(summary.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/60 to-primary/10"></div>
      
      {summary.isNew && (
        <div className="absolute top-2 right-2">
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">New</Badge>
        </div>
      )}
    </motion.div>
  );
  
  const EmptyState = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <BookOpen className="h-8 w-8 text-primary/80" />
      </div>
      <h3 className="text-xl font-medium mb-2">No summaries found</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {hasActiveFilters ? 
          "No summaries match your current filters. Try adjusting or clearing your filters." : 
          "Select bookmarks and use the Summarize button to generate summaries of your content."}
      </p>
      
      {hasActiveFilters && (
        <Button 
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="rounded-full"
        >
          <X className="h-4 w-4 mr-2" />
          Clear filters
        </Button>
      )}
    </motion.div>
  );
  
  return (
    <Layout>
      <div className="h-full flex flex-col pb-16">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10 px-4 pt-2 pb-3">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-full"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Summaries</h1>
            
            <div className="ml-auto flex items-center gap-1.5">
              {selectedSummaries.size > 0 ? (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={deselectAll}
                    className="h-9 rounded-full text-xs font-medium"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={bulkDelete}
                    className="h-9 rounded-full text-xs font-medium"
                  >
                    Delete {selectedSummaries.size}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFilterVisible(!isFilterVisible)}
                    className="h-9 w-9 rounded-full"
                    aria-label="Filter"
                  >
                    <SlidersHorizontal className="h-5 w-5" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={selectAll}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Select all
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportToMarkdown(filteredSummaries)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export as Markdown
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportToPDF(filteredSummaries)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearAllSummaries} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear all summaries
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <SearchSummaries 
                onSearch={setSearchQuery} 
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="w-full h-9 p-0.5 bg-muted/50 rounded-full grid grid-cols-3">
                <TabsTrigger value="all" className="rounded-full text-xs">
                  All
                </TabsTrigger>
                <TabsTrigger value="starred" className="rounded-full text-xs">
                  Starred {starredSummaries.length > 0 && `(${starredSummaries.length})`}
                </TabsTrigger>
                <TabsTrigger value="recent" className="rounded-full text-xs">
                  Recent
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </header>
        
        <AnimatePresence>
          {isFilterVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 border-b overflow-hidden bg-muted/10"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Filters</h3>
                  <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-7 text-xs">
                    Clear all
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-between text-xs h-8"
                      >
                        {activeTag || "Select tag"}
                        <ChevronDown className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <ScrollArea className="h-[200px]">
                        <div className="p-2">
                          <div 
                            className="px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm"
                            onClick={() => setActiveTag(null)}
                          >
                            All tags
                          </div>
                          {allTags.map(tag => (
                            <div 
                              key={tag}
                              className={`px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm ${activeTag === tag ? 'bg-muted' : ''}`}
                              onClick={() => setActiveTag(tag)}
                            >
                              {tag}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-between text-xs h-8"
                      >
                        {activeCategory || "Select category"}
                        <ChevronDown className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <ScrollArea className="h-[200px]">
                        <div className="p-2">
                          <div 
                            className="px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm"
                            onClick={() => setActiveCategory(null)}
                          >
                            All categories
                          </div>
                          {allCategories.map(category => (
                            <div 
                              key={category}
                              className={`px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm ${activeCategory === category ? 'bg-muted' : ''}`}
                              onClick={() => setActiveCategory(category)}
                            >
                              {category}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-between text-xs h-8"
                      >
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd")
                            )
                          ) : (
                            "Date range"
                          )}
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={1}
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-between text-xs h-8"
                      >
                        Sort: {sortBy} {sortOrder === 'asc' ? '↑' : '↓'}
                        <ChevronDown className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <div className="p-2">
                        <div 
                          className={`px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm ${sortBy === 'date' ? 'bg-muted' : ''}`}
                          onClick={() => setSortBy('date')}
                        >
                          Date
                        </div>
                        <div 
                          className={`px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm ${sortBy === 'title' ? 'bg-muted' : ''}`}
                          onClick={() => setSortBy('title')}
                        >
                          Title
                        </div>
                        <div 
                          className={`px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm ${sortBy === 'readingTime' ? 'bg-muted' : ''}`}
                          onClick={() => setSortBy('readingTime')}
                        >
                          Reading time
                        </div>
                        <Separator className="my-1" />
                        <div 
                          className="px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer text-sm"
                          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        >
                          {sortOrder === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <TabsContent value="all" className="m-0 h-full">
              <div className="p-4 grid gap-3">
                {filteredSummaries.length > 0 ? (
                  filteredSummaries.map(summary => (
                    <SummaryCard key={summary.id} summary={summary} />
                  ))
                ) : (
                  <EmptyState />
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="starred" className="m-0 h-full">
              <div className="p-4 grid gap-3">
                {filteredSummaries.length > 0 ? (
                  filteredSummaries.map(summary => (
                    <SummaryCard key={summary.id} summary={summary} />
                  ))
                ) : (
                  <EmptyState />
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="recent" className="m-0 h-full">
              <div className="p-4 grid gap-3">
                {filteredSummaries.length > 0 ? (
                  filteredSummaries.map(summary => (
                    <SummaryCard key={summary.id} summary={summary} />
                  ))
                ) : (
                  <EmptyState />
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </div>
      </div>
    </Layout>
  );
};

export default SummariesPage;
