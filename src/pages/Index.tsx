import Layout from "../components/Layout";
import FeatureGrid from "../components/FeatureGrid";
import WelcomeCard from "../components/WelcomeCard";
import AffiliateSection from "../components/affiliate/AffiliateSection";

const Index = () => {
  console.log("Rendering Index page");

  return (
    <Layout>
      <div className="space-y-6 pb-16">
        <WelcomeCard />
        <FeatureGrid />
        <AffiliateSection />
      </div>
    </Layout>
  );
};

export default Index;