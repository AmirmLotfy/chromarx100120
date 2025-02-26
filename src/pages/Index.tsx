
import { useSubscription } from "@/hooks/use-subscription";
import { useElementSelector } from "@/hooks/useElementSelector";
import Layout from "@/components/Layout";
import FeatureGrid from "@/components/FeatureGrid";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import { toast } from "sonner";

const Index = () => {
  const { currentPlan } = useSubscription();

  const handleElementSelected = (element: HTMLElement) => {
    console.log('Selected element:', element);
    toast.success("Element selected successfully!");
  };

  const { startSelecting } = useElementSelector(handleElementSelected);

  return (
    <Layout>
      <div className="w-full max-w-full px-4 sm:px-6 flex flex-col gap-6">
        {currentPlan === "free" && (
          <div className="w-full max-w-full overflow-hidden rounded-lg">
            <AffiliateBannerCarousel />
          </div>
        )}
        <div className="w-full max-w-full">
          <FeatureGrid />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
