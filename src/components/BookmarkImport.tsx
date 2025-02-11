import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChromeBookmark } from "@/types/bookmark";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, Import, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkNode extends chrome.bookmarks.BookmarkTreeNode {
  isSelected?: boolean;
  children?: BookmarkNode[];
}

interface BookmarkTreeProps {
  node: BookmarkNode;
  level?: number;
  onToggle: (node: BookmarkNode) => void;
}

const BookmarkTree = ({ node, level = 0, onToggle }: BookmarkTreeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-1">
      <div 
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded-md hover:bg-accent/50 cursor-pointer",
          { "ml-4": level > 0 }
        )}
      >
        {node.children && node.children.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        <Checkbox 
          checked={node.isSelected} 
          onCheckedChange={() => onToggle(node)}
          id={`bookmark-${node.id}`}
        />
        <label 
          htmlFor={`bookmark-${node.id}`}
          className="flex items-center gap-2 text-sm cursor-pointer"
        >
          {node.children ? (
            <Folder className="h-4 w-4 text-muted-foreground" />
          ) : null}
          <span className="truncate max-w-[300px]">{node.title || node.url}</span>
        </label>
      </div>
      {isExpanded && node.children && (
        <div className="pl-4">
          {node.children.map((child) => (
            <BookmarkTree
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BookmarkImport = () => {
  const [bookmarkTree, setBookmarkTree] = useState<BookmarkNode[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadBookmarks = async () => {
    if (!chrome.bookmarks) {
      toast.error("Chrome bookmarks API not available");
      return;
    }

    try {
      setIsLoading(true);
      const tree = await chrome.bookmarks.getTree();
      setBookmarkTree(tree as BookmarkNode[]);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      toast.error("Failed to load bookmarks");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNode = (targetNode: BookmarkNode) => {
    const toggleChildren = (node: BookmarkNode): BookmarkNode => {
      if (node.id === targetNode.id) {
        return { ...node, isSelected: !node.isSelected };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(child => toggleChildren(child))
        };
      }
      return node;
    };

    setBookmarkTree(prevTree => 
      prevTree.map(node => toggleChildren(node))
    );
  };

  const selectAll = () => {
    const selectAllNodes = (node: BookmarkNode): BookmarkNode => ({
      ...node,
      isSelected: true,
      children: node.children?.map(selectAllNodes)
    });

    setBookmarkTree(prevTree => 
      prevTree.map(node => selectAllNodes(node))
    );
  };

  const deselectAll = () => {
    const deselectAllNodes = (node: BookmarkNode): BookmarkNode => ({
      ...node,
      isSelected: false,
      children: node.children?.map(deselectAllNodes)
    });

    setBookmarkTree(prevTree => 
      prevTree.map(node => deselectAllNodes(node))
    );
  };

  const collectSelectedBookmarks = (node: BookmarkNode): ChromeBookmark[] => {
    let bookmarks: ChromeBookmark[] = [];
    
    if (node.isSelected && node.url) {
      bookmarks.push({
        id: node.id,
        title: node.title || "",
        url: node.url,
        dateAdded: node.dateAdded,
      });
    }
    
    if (node.children) {
      node.children.forEach(child => {
        bookmarks = [...bookmarks, ...collectSelectedBookmarks(child)];
      });
    }
    
    return bookmarks;
  };

  const handleImport = async () => {
    try {
      setIsLoading(true);
      const selectedBookmarks = bookmarkTree.flatMap(node => 
        collectSelectedBookmarks(node)
      );

      if (selectedBookmarks.length === 0) {
        toast.error("Please select bookmarks to import");
        return;
      }

      // Import selected bookmarks
      for (const bookmark of selectedBookmarks) {
        await chrome.bookmarks.create({
          parentId: "1", // Default to bookmarks bar
          title: bookmark.title,
          url: bookmark.url
        });
      }

      toast.success(`Successfully imported ${selectedBookmarks.length} bookmarks`);
      setIsOpen(false);
    } catch (error) {
      console.error("Error importing bookmarks:", error);
      toast.error("Failed to import bookmarks");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={loadBookmarks}
        >
          <Import className="h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Bookmarks</DialogTitle>
          <DialogDescription>
            Select the bookmarks and folders you want to import
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={isLoading}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deselectAll}
              disabled={isLoading}
            >
              Deselect All
            </Button>
          </div>

          <ScrollArea className="h-[400px] rounded-md border p-4">
            {bookmarkTree.map((node) => (
              <BookmarkTree
                key={node.id}
                node={node}
                onToggle={toggleNode}
              />
            ))}
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isLoading}
            >
              {isLoading ? "Importing..." : "Import Selected"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookmarkImport;
