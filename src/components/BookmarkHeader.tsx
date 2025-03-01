
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Trash,
  Plus,
  Tag,
  MoreHorizontal,
  FolderPlus,
  Search,
  X,
  Menu,
} from "lucide-react";
import { ChromeBookmark } from "@/types/bookmark";
import ViewToggle from "./ViewToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
    <div className="bg-background/80 backdrop-blur-sm sticky top-0 z-10 pb-4 space-y-4">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-color to-secondary-color bg-clip-text text-transparent">Bookmarks</h1>

          <div className="flex items-center gap-2">
            <ViewToggle view={view} onViewChange={onViewChange} />

            {selectedBookmarksCount > 0 ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={onDeleteSelected}
                className="flex items-center gap-1 rounded-full h-8 px-3"
              >
                <Trash className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{selectedBookmarksCount}</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                {importComponent || (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onImport([])}
                    className="hidden sm:flex items-center gap-1 h-8 px-3 rounded-full"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Import</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateFolder}
                  className="hidden sm:flex items-center gap-1 h-8 px-3 rounded-full"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">New Folder</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full sm:hidden"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-lg">
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
          <div className="flex items-center justify-between bg-accent/20 p-2.5 rounded-xl animate-fade-in">
            <span className="text-xs sm:text-sm font-medium">
              {selectedBookmarksCount} bookmark{selectedBookmarksCount === 1 ? "" : "s"} selected
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="h-7 text-xs rounded-full hover:bg-accent px-2"
              >
                <Tag className="h-3.5 w-3.5 mr-1.5" />
                <span>Categorize</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-xl">
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
                className="rounded-lg"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button onClick={handleCategorySubmit} className="rounded-lg">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookmarkHeader;
