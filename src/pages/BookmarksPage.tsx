import Layout from "@/components/Layout";
import BookmarkContent from "@/components/BookmarkContent";
import BookmarkControls from "@/components/BookmarkControls";
import { useBookmarks } from "@/hooks/use-bookmarks";

const BookmarksPage = () => {
  const { bookmarks, loading } = useBookmarks();

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
          <BookmarkControls 
            sortBy="dateAdded"
            onSortChange={() => {}}
          />
          <BookmarkContent 
            bookmarks={bookmarks}
            loading={loading}
          />
        </div>
      </div>
    </Layout>
  );
};

export default BookmarksPage;