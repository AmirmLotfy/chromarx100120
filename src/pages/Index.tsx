
import Layout from "@/components/Layout";
import FeatureGrid from "@/components/FeatureGrid";
import { useSubscription } from "@/hooks/use-subscription";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";

const Index = () => {
  const { currentPlan } = useSubscription();

  return (
    <Layout>
      <div className="w-full">
        {currentPlan === "free" && (
          <div className="w-full">
            <AffiliateBannerCarousel />
          </div>
        )}
        <FeatureGrid />
      </div>
    </Layout>
  );
};

export default Index;
