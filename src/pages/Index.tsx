import Layout from "../components/Layout";
import FeatureGrid from "../components/FeatureGrid";
import WelcomeCard from "../components/WelcomeCard";
import CompactServiceBanner from "../components/affiliate/CompactServiceBanner";
import { useFirebase } from "@/contexts/FirebaseContext";
import { useEffect, useState } from "react";
import { storage } from "@/lib/chrome-utils";

const Index = () => {
  const { user } = useFirebase();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("free");

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (user) {
        try {
          console.log("Fetching subscription status for user:", user.id);
          const subscriptionData = await storage.get('subscriptions');
          const status = subscriptionData?.[user.id]?.status || "free";
          console.log("User subscription status:", status);
          setSubscriptionStatus(status);
        } catch (error) {
          console.error("Error fetching subscription status:", error);
          setSubscriptionStatus("free");
        }
      } else {
        console.log("No user logged in, defaulting to free tier");
        setSubscriptionStatus("free");
      }
    };

    fetchSubscriptionStatus();
  }, [user]);

  return (
    <Layout>
      <div className="space-y-4 pb-16 w-full max-w-4xl mx-auto">
        <div className="px-2 sm:px-4">
          <WelcomeCard />
        </div>
        {subscriptionStatus === "free" && <CompactServiceBanner />}
        <FeatureGrid />
      </div>
    </Layout>
  );
};

export default Index;