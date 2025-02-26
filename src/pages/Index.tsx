
import Layout from "@/components/Layout";
import FeatureGrid from "@/components/FeatureGrid";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";

const Index = () => {
  return (
    <Layout>
      <div className="w-full">
        <div className="w-full">
          <AffiliateBannerCarousel />
        </div>
        <FeatureGrid />
      </div>
    </Layout>
  );
};

export default Index;
