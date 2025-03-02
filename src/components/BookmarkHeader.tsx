
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Trash,
  Plus,
  Tag,
  FolderPlus,
  Search,
  X,
  Menu,
} from "lucide-react";
import { ChromeBookmark } from "@/types/bookmark";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import SearchBar, { SearchFilter } from "./SearchBar";
import { motion } from "framer-motion";

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
    <div className="bg-background/95 backdrop-blur-md sticky top-0 z-10 pb-3 px-1 space-y-3 rounded-b-xl shadow-sm">
      <div className="flex flex-col space-y-3">
        <div className="flex justify-between items-center pt-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Bookmarks</h1>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
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
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {importComponent || (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onImport([])}
                    className="flex items-center gap-1 h-8 px-3 rounded-full"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Import</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateFolder}
                  className="flex items-center gap-1 h-8 px-3 rounded-full"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">New Folder</span>
                </Button>
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
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between bg-primary/5 p-2.5 rounded-xl"
          >
            <span className="text-xs sm:text-sm font-medium">
              {selectedBookmarksCount} bookmark{selectedBookmarksCount === 1 ? "" : "s"} selected
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="h-7 text-xs rounded-full hover:bg-primary/10 px-2.5"
              >
                <Tag className="h-3.5 w-3.5 mr-1.5" />
                <span>Categorize</span>
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-xl max-w-[95vw] sm:max-w-md">
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
              <Button onClick={handleCategorySubmit} className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookmarkHeader;
