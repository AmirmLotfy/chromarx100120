import Layout from "../components/Layout";
import FeatureGrid from "../components/FeatureGrid";
import WelcomeCard from "../components/WelcomeCard";
import CompactServiceBanner from "../components/affiliate/CompactServiceBanner";
import { useFirebase } from "@/contexts/FirebaseContext";

const Index = () => {
  const { user } = useFirebase();

  return (
    <Layout>
      <div className="space-y-4 pb-16">
        <WelcomeCard />
        <CompactServiceBanner />
        <FeatureGrid />
      </div>
    </Layout>
  );
};

export default Index;