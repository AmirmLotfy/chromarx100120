import Layout from "@/components/Layout";
import BookmarkContent from "@/components/BookmarkContent";
import { useBookmarks } from "@/hooks/use-bookmarks";

const BookmarksPage = () => {
  const {
    bookmarks,
    loading,
    categories,
    domains,
    selectedCategory,
    selectedDomain,
    onSelectCategory,
    onSelectDomain,
    selectedBookmarks,
    onToggleSelect,
    onDelete,
    formatDate,
    view,
    onReorder,
    onBulkDelete,
    onRefresh,
    filteredBookmarks,
    onUpdateCategories,
  } = useBookmarks();

  return (
    <Layout>
      <div className="space-y-6 px-4 md:px-6 pb-20 md:pb-6 pt-6 md:pt-8">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bookmarks</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Manage and organize your bookmarks efficiently
          </p>
        </div>
        <div className="grid gap-6">
          <BookmarkContent
            categories={categories}
            domains={domains}
            selectedCategory={selectedCategory}
            selectedDomain={selectedDomain}
            onSelectCategory={onSelectCategory}
            onSelectDomain={onSelectDomain}
            bookmarks={bookmarks}
            selectedBookmarks={selectedBookmarks}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
            formatDate={formatDate}
            view={view}
            onReorder={onReorder}
            onBulkDelete={onBulkDelete}
            onRefresh={onRefresh}
            loading={loading}
            filteredBookmarks={filteredBookmarks}
            onUpdateCategories={onUpdateCategories}
          />
        </div>
      </div>
    </Layout>
  );
};

export default BookmarksPage;