import { ChromeBookmark } from "@/types/bookmark";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import SortableBookmark from "./SortableBookmark";
import { useEffect, useState, useRef, useCallback } from "react";
import { extractDomain } from "@/utils/domainUtils";
import { Button } from "./ui/button";
import { CheckSquare, FileText, Globe, Sparkles, Trash2, FolderPlus, Tag } from "lucide-react";
import { toast } from "sonner";
import { summarizeContent, suggestBookmarkCategory, summarizeBookmark } from "@/utils/geminiUtils";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { findDuplicateBookmarks, findBrokenBookmarks } from "@/utils/bookmarkCleanup";
import { useLanguage } from "@/stores/languageStore";
import { fetchPageContent } from "@/utils/contentExtractor";
import { useVirtualizer } from '@tanstack/react-virtual';

interface BookmarkListProps {
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  view: "grid" | "list";
  onReorder?: (bookmarks: ChromeBookmark[]) => void;
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
}

const BATCH_SIZE = 20;

const BookmarkList = ({
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
  view,
  onReorder,
  onUpdateCategories,
}: BookmarkListProps) => {
  const [items, setItems] = useState(bookmarks);
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);
  const [groupedByDomain, setGroupedByDomain] = useState<Record<string, ChromeBookmark[]>>({});
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCategorizeDialogOpen, setIsCategorizeDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [newTags, setNewTags] = useState("");
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement>(null);

  // Group bookmarks by domain and create a flat list for virtualization
  const domainGroups = Object.entries(groupedByDomain).map(([domain, bookmarks]) => ({
    type: 'header' as const,
    domain,
    count: bookmarks.length,
  })).reduce<Array<{ type: 'header' | 'bookmark', data: any }>>((acc, group) => {
    acc.push({ type: 'header', data: group });
    groupedByDomain[group.domain].forEach(bookmark => {
      acc.push({ type: 'bookmark', data: bookmark });
    });
    return acc;
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: domainGroups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index) => {
      return domainGroups[index].type === 'header' ? 48 : view === 'grid' ? 200 : 80;
    }, [view]),
    overscan: 5,
  });

  useEffect(() => {
    setItems(bookmarks);
    const grouped = bookmarks.reduce((acc, bookmark) => {
      if (bookmark.url) {
        const domain = extractDomain(bookmark.url);
        if (!acc[domain]) {
          acc[domain] = [];
        }
        acc[domain].push(bookmark);
      }
      return acc;
    }, {} as Record<string, ChromeBookmark[]>);
    setGroupedByDomain(grouped);
  }, [bookmarks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (focusedIndex === -1) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, bookmarks.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < bookmarks.length) {
            onToggleSelect(bookmarks[focusedIndex].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, bookmarks, onToggleSelect]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((item) => item.id === active.id);
        const newIndex = prevItems.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(prevItems, oldIndex, newIndex);
        onReorder?.(newItems);
        return newItems;
      });
    }
  };

  const handleSelectAll = () => {
    const allSelected = bookmarks.length === selectedBookmarks.size;
    if (allSelected) {
      // Deselect all
      bookmarks.forEach(bookmark => {
        if (selectedBookmarks.has(bookmark.id)) {
          onToggleSelect(bookmark.id);
        }
      });
    } else {
      // Select all
      bookmarks.forEach(bookmark => {
        if (!selectedBookmarks.has(bookmark.id)) {
          onToggleSelect(bookmark.id);
        }
      });
    }
  };

  const handleCleanup = async () => {
    if (selectedBookmarks.size === 0) {
      toast.error("Please select bookmarks to clean up");
      return;
    }

    setIsProcessing(true);
    try {
      const selectedBookmarksArray = Array.from(selectedBookmarks)
        .map(id => bookmarks.find(b => b.id === id))
        .filter((b): b is ChromeBookmark => b !== undefined);

      const duplicates = findDuplicateBookmarks(selectedBookmarksArray);
      const brokenBookmarks = await findBrokenBookmarks(selectedBookmarksArray);
      
      if (duplicates.byUrl.length === 0 && duplicates.byTitle.length === 0 && brokenBookmarks.length === 0) {
        toast.info("No issues found in selected bookmarks");
        return;
      }

      await onDelete(Array.from(selectedBookmarks)[0]);
      toast.success("Cleanup completed successfully");
    } catch (error) {
      toast.error("Failed to clean up bookmarks");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateSummaries = async () => {
    if (selectedBookmarks.size === 0) {
      toast.error("Please select bookmarks to summarize");
      return;
    }

    setIsProcessing(true);
    const { currentLanguage } = useLanguage();
    
    try {
      const selectedBookmarksArray = Array.from(selectedBookmarks)
        .map(id => bookmarks.find(b => b.id === id))
        .filter((b): b is ChromeBookmark => b !== undefined);

      const summaries = await Promise.all(
        selectedBookmarksArray.map(async (bookmark) => {
          const summary = await summarizeBookmark(bookmark, currentLanguage.code);
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
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestCategories = async () => {
    if (selectedBookmarks.size === 0) {
      toast.error("Please select bookmarks to categorize");
      return;
    }

    setIsProcessing(true);
    const { currentLanguage } = useLanguage();
    try {
      const selectedBookmarksArray = Array.from(selectedBookmarks)
        .map(id => bookmarks.find(b => b.id === id))
        .filter((b): b is ChromeBookmark => b !== undefined);

      const updatedBookmarks = await Promise.all(
        selectedBookmarksArray.map(async (bookmark) => {
          const content = await fetchPageContent(bookmark.url || "");
          return {
            ...bookmark,
            category: await suggestBookmarkCategory(
              bookmark.title,
              bookmark.url || "",
              content,
              currentLanguage.code
            ),
          };
        })
      );

      onUpdateCategories(updatedBookmarks);
      toast.success("Categories suggested successfully!");
    } catch (error) {
      toast.error("Failed to suggest categories");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkMove = async () => {
    if (selectedBookmarks.size === 0) {
      toast.error("Please select bookmarks to move");
      return;
    }

    try {
      if (!newFolderName.trim()) {
        toast.error("Please enter a folder name");
        return;
      }

      // Create new folder and move bookmarks
      if (chrome.bookmarks) {
        const folder = await chrome.bookmarks.create({ title: newFolderName });
        const moves = Array.from(selectedBookmarks).map(id => 
          chrome.bookmarks.move(id, { parentId: folder.id })
        );
        await Promise.all(moves);
        toast.success(`Moved ${selectedBookmarks.size} bookmarks to "${newFolderName}"`);
        setIsMoveDialogOpen(false);
        setNewFolderName("");
      }
    } catch (error) {
      console.error("Move failed:", error);
      toast.error("Failed to move bookmarks");
    }
  };

  const handleBulkCategorize = async () => {
    if (selectedBookmarks.size === 0) {
      toast.error("Please select bookmarks to categorize");
      return;
    }

    try {
      const selectedBookmarksArray = Array.from(selectedBookmarks)
        .map(id => bookmarks.find(b => b.id === id))
        .filter((b): b is ChromeBookmark => b !== undefined);

      const updatedBookmarks = selectedBookmarksArray.map(bookmark => ({
        ...bookmark,
        category: newCategory
      }));

      onUpdateCategories(updatedBookmarks);
      setIsCategorizeDialogOpen(false);
      setNewCategory("");
      toast.success(`Categorized ${selectedBookmarks.size} bookmarks`);
    } catch (error) {
      console.error("Categorize failed:", error);
      toast.error("Failed to categorize bookmarks");
    }
  };

  const handleBulkTag = async () => {
    if (selectedBookmarks.size === 0) {
      toast.error("Please select bookmarks to tag");
      return;
    }

    try {
      const tags = newTags.split(',').map(tag => tag.trim()).filter(Boolean);
      const selectedBookmarksArray = Array.from(selectedBookmarks)
        .map(id => bookmarks.find(b => b.id === id))
        .filter((b): b is ChromeBookmark => b !== undefined);

      const updatedBookmarks = selectedBookmarksArray.map(bookmark => ({
        ...bookmark,
        metadata: {
          ...bookmark.metadata,
          tags: [...(bookmark.metadata?.tags || []), ...tags]
        }
      }));

      onUpdateCategories(updatedBookmarks);
      setIsTagDialogOpen(false);
      setNewTags("");
      toast.success(`Tagged ${selectedBookmarks.size} bookmarks`);
    } catch (error) {
      console.error("Tag failed:", error);
      toast.error("Failed to tag bookmarks");
    }
  };

  const renderVirtualizedBookmarks = () => (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
      style={{
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = domainGroups[virtualRow.index];
          
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {item.type === 'header' ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 backdrop-blur-sm rounded-lg sticky top-0 z-10">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">{item.data.domain}</h3>
                  <span className="text-xs text-muted-foreground">
                    ({item.data.count})
                  </span>
                </div>
              ) : (
                <SortableBookmark
                  bookmark={item.data}
                  selected={selectedBookmarks.has(item.data.id)}
                  onToggleSelect={onToggleSelect}
                  onDelete={onDelete}
                  formatDate={formatDate}
                  view={view}
                  tabIndex={focusedIndex === bookmarks.indexOf(item.data) ? 0 : -1}
                  onFocus={() => setFocusedIndex(bookmarks.indexOf(item.data))}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={view === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="w-full sm:w-auto bg-gradient-to-r from-accent to-muted hover:from-accent/90 hover:to-muted/90 transition-all duration-300 shadow-sm"
            >
              <CheckSquare className="h-4 w-4 mr-1.5" />
              {selectedBookmarks.size === bookmarks.length ? "Deselect All" : "Select All"}
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMoveDialogOpen(true)}
                    disabled={isProcessing || selectedBookmarks.size === 0}
                    className="w-full sm:w-auto bg-gradient-to-r from-accent to-muted hover:from-accent/90 hover:to-muted/90 transition-all duration-300 shadow-sm"
                  >
                    <FolderPlus className="h-4 w-4 mr-1.5" />
                    Move
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Move selected bookmarks to a new folder
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCategorizeDialogOpen(true)}
                    disabled={isProcessing || selectedBookmarks.size === 0}
                    className="w-full sm:w-auto bg-gradient-to-r from-accent to-muted hover:from-accent/90 hover:to-muted/90 transition-all duration-300 shadow-sm"
                  >
                    <Globe className="h-4 w-4 mr-1.5" />
                    Categorize
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Set category for selected bookmarks
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTagDialogOpen(true)}
                    disabled={isProcessing || selectedBookmarks.size === 0}
                    className="w-full sm:w-auto bg-gradient-to-r from-accent to-muted hover:from-accent/90 hover:to-muted/90 transition-all duration-300 shadow-sm"
                  >
                    <Tag className="h-4 w-4 mr-1.5" />
                    Tag
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Add tags to selected bookmarks
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCleanup}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-gradient-to-r from-accent to-muted hover:from-accent/90 hover:to-muted/90 transition-all duration-300 shadow-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Cleanup
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Find and remove duplicate or broken bookmarks
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleGenerateSummaries}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-gradient-to-r from-accent to-muted hover:from-accent/90 hover:to-muted/90 transition-all duration-300 shadow-sm"
                  >
                    <FileText className="h-4 w-4 mr-1.5" />
                    Summarize
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Generate summaries for selected bookmarks
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSuggestCategories}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-gradient-to-r from-accent to-muted hover:from-accent/90 hover:to-muted/90 transition-all duration-300 shadow-sm"
                  >
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    Categorize
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Suggest categories for selected bookmarks
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Move Dialog */}
          <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Move Bookmarks to New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label htmlFor="folderName" className="text-sm font-medium">
                    New Folder Name
                  </label>
                  <Input
                    id="folderName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                  />
                </div>
                <Button onClick={handleBulkMove} className="w-full">
                  Move Bookmarks
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Categorize Dialog */}
          <Dialog open={isCategorizeDialogOpen} onOpenChange={setIsCategorizeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Category for Bookmarks</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
                  <Input
                    id="category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter category name"
                  />
                </div>
                <Button onClick={handleBulkCategorize} className="w-full">
                  Set Category
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Tag Dialog */}
          <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Tags to Bookmarks</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label htmlFor="tags" className="text-sm font-medium">
                    Tags (comma-separated)
                  </label>
                  <Input
                    id="tags"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                <Button onClick={handleBulkTag} className="w-full">
                  Add Tags
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {renderVirtualizedBookmarks()}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default BookmarkList;
