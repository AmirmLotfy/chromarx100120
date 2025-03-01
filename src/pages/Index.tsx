import { useSubscription } from "@/hooks/use-subscription";
import { useElementSelector } from "@/hooks/useElementSelector";
import Layout from "@/components/Layout";
import FeatureGrid from "@/components/FeatureGrid";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { currentPlan } = useSubscription();
  const { user } = useAuth();

  const handleElementSelected = (element: HTMLElement) => {
    console.log('Selected element:', element);
    toast.success("Element selected successfully!");
  };

  const { startSelecting } = useElementSelector(handleElementSelected);

  return (
    <Layout>
      {!user && (
        <div className="mb-6 p-4 bg-primary-foreground rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Welcome to ChroMarx!</h2>
          <p className="mb-4">Sign in to start managing your bookmarks with AI-powered features.</p>
          <div className="flex gap-3">
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
            <Link to="/plans">
              <Button variant="outline">Learn More</Button>
            </Link>
          </div>
        </div>
      )}
      
      {currentPlan === "free" && (
        <div className="w-full">
          <AffiliateBannerCarousel />
        </div>
      )}
      <FeatureGrid />
    </Layout>
  );
};

export default Index;
