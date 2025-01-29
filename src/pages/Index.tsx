import Layout from "../components/Layout";
import FeatureGrid from "../components/FeatureGrid";
import WelcomeCard from "../components/WelcomeCard";
import AffiliateSection from "../components/affiliate/AffiliateSection";
import { useFirebase } from "@/contexts/FirebaseContext";

const Index = () => {
  const { user } = useFirebase();

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