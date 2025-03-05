
import { useSubscription } from "@/hooks/use-subscription";
import { useElementSelector } from "@/hooks/useElementSelector";
import Layout from "@/components/Layout";
import FeatureGrid from "@/components/FeatureGrid";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { AppOnboarding } from "@/components/onboarding/AppOnboarding";
import { HeaderHelp } from "@/components/onboarding/HeaderHelp";
import { FeatureTip } from "@/components/onboarding/FeatureTip";

const Index = () => {
  const { currentPlan } = useSubscription();
  const { user } = useAuth();

  const handleElementSelected = (element: HTMLElement) => {
    console.log('Selected element:', element);
    toast.success("Element selected successfully!");
  };

  const { startSelecting } = useElementSelector(handleElementSelected);

  return (
    <AppOnboarding>
      <Layout>
        {currentPlan === "free" && (
          <div className="w-full">
            <AffiliateBannerCarousel />
          </div>
        )}
        
        <FeatureTip
          id="feature-grid-tip"
          title="Explore Features"
          description="Discover all the powerful tools ChroMarx offers to manage your bookmarks efficiently."
        >
          <FeatureGrid />
        </FeatureTip>
      </Layout>
    </AppOnboarding>
  );
};

export default Index;
