
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Trash,
  Plus,
  Folder,
  Tag,
  MoreHorizontal,
  FolderPlus,
  List,
  Grid,
  Search,
  X,
  Menu,
} from "lucide-react";
import { ChromeBookmark } from "@/types/bookmark";
import ViewToggle from "./ViewToggle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import SearchBar, { SearchFilter } from "./SearchBar";

interface BookmarkHeaderProps {
  selectedBookmarksCount: number;
  selectedBookmarks: ChromeBookmark[];
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  onDeleteSelected: () => void;
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onImport: (bookmarks: ChromeBookmark[]) => void;
  onCreateFolder: () => void;
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  importComponent?: React.ReactNode;
  onFilterChange?: (filters: SearchFilter) => void;
  categories?: string[];
  domains?: string[];
}

const BookmarkHeader = ({
  selectedBookmarksCount,
  selectedBookmarks,
  view,
  onViewChange,
  onDeleteSelected,
  onUpdateCategories,
  searchQuery,
  onSearchChange,
  onImport,
  onCreateFolder,
  suggestions,
  onSelectSuggestion,
  importComponent,
  onFilterChange = () => {},
  categories = [],
  domains = [],
}: BookmarkHeaderProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  console.log("BookmarkHeader rendered with view:", view);

  const handleCategorySubmit = () => {
    if (!newCategory.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    if (selectedBookmarksCount === 0) {
      toast.error("No bookmarks selected");
      return;
    }

    const updatedBookmarks = selectedBookmarks.map((bookmark) => ({
      ...bookmark,
      category: newCategory,
    }));

    onUpdateCategories(updatedBookmarks);
    setIsDialogOpen(false);
    setNewCategory("");
    toast.success(
      `Updated category to "${newCategory}" for ${selectedBookmarksCount} bookmark${
        selectedBookmarksCount === 1 ? "" : "s"
      }`
    );
  };

  return (
    <div className="bg-background sticky top-0 z-10 pb-4">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold">Bookmarks</h1>

          <div className="flex items-center space-x-2">
            <ViewToggle view={view} onViewChange={onViewChange} />

            <div className="flex items-center space-x-1">
              {selectedBookmarksCount > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeleteSelected}
                  className="flex items-center space-x-1"
                >
                  <Trash className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                  <span>{selectedBookmarksCount}</span>
                </Button>
              ) : (
                <div className="flex items-center space-x-1">
                  {importComponent || (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Legacy import functionality - should be replaced by importComponent
                        onImport([]);
                      }}
                      className="hidden sm:flex items-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Import</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCreateFolder}
                    className="hidden sm:flex items-center space-x-1"
                  >
                    <FolderPlus className="h-4 w-4" />
                    <span>New Folder</span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 sm:hidden"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onImport([])}>
                        <Plus className="h-4 w-4 mr-2" />
                        <span>Import</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onCreateFolder}>
                        <FolderPlus className="h-4 w-4 mr-2" />
                        <span>New Folder</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full">
          <SearchBar
            searchTerm={searchQuery}
            onSearch={onSearchChange}
            suggestions={suggestions}
            onSelectSuggestion={onSelectSuggestion}
            onFilterChange={onFilterChange}
            categories={categories}
            domains={domains}
          />
        </div>

        {selectedBookmarksCount > 0 && (
          <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
            <span className="text-sm">
              {selectedBookmarksCount} bookmark{selectedBookmarksCount === 1 ? "" : "s"} selected
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="bg-transparent"
              >
                <Tag className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Categorize</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Work, Personal, Shopping"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCategorySubmit}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookmarkHeader;
