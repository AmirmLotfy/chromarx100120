
import { useState, useMemo } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import VirtualizedBookmarkList from "./VirtualizedBookmarkList";

interface PaginatedBookmarkListProps {
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
  searchQuery?: string;
}

export const PaginatedBookmarkList = ({
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
  onUpdateCategories,
  searchQuery = "",
}: PaginatedBookmarkListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // Number of bookmarks per page
  
  const totalPages = useMemo(() => 
    Math.ceil(bookmarks.length / pageSize), 
    [bookmarks.length, pageSize]
  );
  
  const paginatedBookmarks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return bookmarks.slice(startIndex, startIndex + pageSize);
  }, [bookmarks, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to first page when bookmarks change significantly
  useMemo(() => {
    setCurrentPage(1);
  }, [bookmarks.length]);

  return (
    <div className="space-y-4">
      <VirtualizedBookmarkList
        bookmarks={paginatedBookmarks}
        selectedBookmarks={selectedBookmarks}
        onToggleSelect={onToggleSelect}
        onDelete={onDelete}
        formatDate={formatDate}
        onUpdateCategories={onUpdateCategories}
        searchQuery={searchQuery}
      />
      
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaginatedBookmarkList;
