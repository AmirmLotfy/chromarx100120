
import { useState } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import BookmarkList from "./BookmarkList";
import BookmarkCategories from "./BookmarkCategories";
import BookmarkDomains from "./BookmarkDomains";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CloudOff } from "lucide-react";

interface BookmarkContentProps {
  categories: { name: string; count: number }[];
  domains: { domain: string; count: number }[];
  selectedCategory: string | null;
  selectedDomain: string | null;
  onSelectCategory: (category: string | null) => void;
  onSelectDomain: (domain: string | null) => void;
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  view: "grid" | "list";
  onReorder?: (bookmarks: ChromeBookmark[]) => void;
  onBulkDelete: () => void;
  onRefresh: () => void;
  loading: boolean;
  filteredBookmarks: ChromeBookmark[];
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
  isOffline?: boolean;
}

const BookmarkContent = ({
  categories,
  domains,
  selectedCategory,
  selectedDomain,
  onSelectCategory,
  onSelectDomain,
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
  view,
  onReorder,
  onBulkDelete,
  onRefresh,
  loading,
  filteredBookmarks,
  onUpdateCategories,
  isOffline = false,
}: BookmarkContentProps) => {
  const [activeTab, setActiveTab] = useState<string>("all");

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      );
    }

    if (filteredBookmarks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed rounded-lg">
          <div className="text-center p-6">
            <p className="text-lg font-medium">No bookmarks found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try a different search or add new bookmarks
            </p>
          </div>
        </div>
      );
    }

    return (
      <BookmarkList
        bookmarks={filteredBookmarks}
        selectedBookmarks={selectedBookmarks}
        onToggleSelect={onToggleSelect}
        onDelete={onDelete}
        formatDate={formatDate}
        view={view}
        onReorder={onReorder}
        onUpdateCategories={onUpdateCategories}
      />
    );
  };

  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="all">All Bookmarks</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
        <TabsTrigger value="domains">Domains</TabsTrigger>
      </TabsList>

      {isOffline && (
        <div className="mb-4 flex items-center p-3 bg-background border rounded-md border-amber-200 dark:border-amber-900 text-sm">
          <CloudOff className="h-4 w-4 text-amber-500 mr-2" />
          <p>Offline mode: Some features like drag-and-drop organization and AI categorization are limited.</p>
        </div>
      )}

      <TabsContent value="all" className="space-y-6">
        {renderContent()}
      </TabsContent>

      <TabsContent value="categories">
        <BookmarkCategories
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
        {selectedCategory && (
          <div className="mt-6 space-y-6">
            <h2 className="text-lg font-semibold">
              Bookmarks in "{selectedCategory}"
            </h2>
            {renderContent()}
          </div>
        )}
      </TabsContent>

      <TabsContent value="domains">
        <BookmarkDomains
          domains={domains}
          selectedDomain={selectedDomain}
          onSelectDomain={onSelectDomain}
        />
        {selectedDomain && (
          <div className="mt-6 space-y-6">
            <h2 className="text-lg font-semibold">
              Bookmarks from "{selectedDomain}"
            </h2>
            {renderContent()}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default BookmarkContent;
