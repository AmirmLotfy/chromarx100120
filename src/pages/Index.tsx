
import { useSubscription } from "@/hooks/use-subscription";
import { useElementSelector } from "@/hooks/useElementSelector";
import Layout from "@/components/Layout";
import FeatureGrid from "@/components/FeatureGrid";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { cache } from "@/utils/cacheUtils";
import { dummyBookmarks } from "@/utils/dummyBookmarks";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { currentPlan } = useSubscription();
  const { user } = useAuth();
  const [recentBookmarks, setRecentBookmarks] = useState<ChromeBookmark[]>([]);

  const handleElementSelected = (element: HTMLElement) => {
    console.log('Selected element:', element);
    toast.success("Element selected successfully!");
  };

  const { startSelecting } = useElementSelector(handleElementSelected);

  useEffect(() => {
    // Initialize dummy bookmarks in cache
    cache.preloadDummyData('bookmarks', dummyBookmarks);
    
    // Try to get bookmarks from cache
    const loadBookmarks = async () => {
      try {
        const cachedBookmarks = await cache.get<ChromeBookmark[]>('bookmarks');
        if (cachedBookmarks && cachedBookmarks.length > 0) {
          console.log('Loaded cached bookmarks:', cachedBookmarks.length);
          setRecentBookmarks(cachedBookmarks.slice(0, 5)); // Show only 5 most recent
        } else {
          console.log('No cached bookmarks found, loading dummy data');
          setRecentBookmarks(dummyBookmarks.slice(0, 5));
        }
      } catch (error) {
        console.error('Error loading bookmarks:', error);
        setRecentBookmarks(dummyBookmarks.slice(0, 5));
      }
    };
    
    loadBookmarks();
  }, []);

  return (
    <Layout>
      {currentPlan === "free" && (
        <div className="w-full">
          <AffiliateBannerCarousel />
        </div>
      )}
      
      {recentBookmarks.length > 0 && (
        <div className="mb-8 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <BookmarkIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Recent Bookmarks
            </h2>
            <Link to="/bookmarks">
              <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                See all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-2">
            {recentBookmarks.map((bookmark) => (
              <a 
                key={bookmark.id} 
                href={bookmark.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-start p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{bookmark.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{bookmark.url}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
      
      <FeatureGrid />
    </Layout>
  );
};

export default Index;
