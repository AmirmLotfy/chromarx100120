
import { useSubscription } from "@/hooks/use-subscription";
import { useElementSelector } from "@/hooks/useElementSelector";
import Layout from "@/components/Layout";
import FeatureGrid from "@/components/FeatureGrid";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bookmark, Timer } from "lucide-react";

const Index = () => {
  const { currentPlan } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleElementSelected = (element: HTMLElement) => {
    console.log('Selected element:', element);
    toast.success("Element selected successfully!");
  };

  const { startSelecting } = useElementSelector(handleElementSelected);

  return (
    <Layout>
      {currentPlan === "free" && (
        <div className="w-full">
          <AffiliateBannerCarousel />
        </div>
      )}
      
      {/* Quick access buttons */}
      <div className="w-full max-w-4xl mx-auto p-4 grid grid-cols-3 gap-3 mb-6">
        <Button 
          onClick={() => navigate("/chat")}
          variant="outline" 
          className="flex flex-col items-center justify-center h-24 border-primary/10 hover:border-primary/30"
        >
          <MessageSquare className="h-8 w-8 mb-2 text-primary/70" />
          <span>Chat</span>
        </Button>
        <Button 
          onClick={() => navigate("/bookmarks")}
          variant="outline" 
          className="flex flex-col items-center justify-center h-24 border-primary/10 hover:border-primary/30"
        >
          <Bookmark className="h-8 w-8 mb-2 text-primary/70" />
          <span>Bookmarks</span>
        </Button>
        <Button 
          onClick={() => navigate("/timer")}
          variant="outline" 
          className="flex flex-col items-center justify-center h-24 border-primary/10 hover:border-primary/30"
        >
          <Timer className="h-8 w-8 mb-2 text-primary/70" />
          <span>Timer</span>
        </Button>
      </div>
      
      <FeatureGrid />
    </Layout>
  );
};

export default Index;
